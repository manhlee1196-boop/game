// ============================================================================
//  SaveSystem.cs — Lưu/tải game dạng JSON có checksum, hỗ trợ migrate phiên bản
//  Đặt tại: Assets/Scripts/Save/
// ============================================================================
using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using VuonMo.Core;
using VuonMo.Data;
using VuonMo.Farming;
using VuonMo.InventorySystem;
using VuonMo.NPCSystem;

namespace VuonMo.SaveSystem
{
    [Serializable]
    public class SaveData
    {
        public int saveVersion = 1;
        public string savedAtIso;

        // Thời gian
        public int year = 1;
        public int season = 0;
        public int day = 1;
        public int hour = 6;
        public int minute = 0;
        public double totalMinutes = 0;

        // Thời tiết
        public int weatherToday, weatherTomorrow, weatherAfter;

        // Người chơi
        public float[] playerPos = new float[3];
        public float playerYaw;
        public int waterCharges = 20;

        // Túi đồ & ruộng
        public Inventory.SaveData inventory = new Inventory.SaveData();
        public List<FarmGrid.TileSave> tiles = new List<FarmGrid.TileSave>();

        // Cộng đồng
        public List<int> npcHeartPoints = new List<int>();
        public List<bool> npcTalkedToday = new List<bool>();

        public string checksum = "";
    }

    public static class SaveSystem
    {
        public const int CurrentVersion = 1;
        private const string FolderName = "VườnMơSaves";

        private static string Folder => Path.Combine(Application.persistentDataPath, FolderName);

        public static string PathFor(int slot) => Path.Combine(Folder, $"save_slot{slot}.json");

        // ------------------------------------------------------------------
        public static bool Save(int slot, CropData[] cropDatabase, NPCRegistry npcRegistry = null)
        {
            try
            {
                Directory.CreateDirectory(Folder);

                var data = new SaveData
                {
                    saveVersion = CurrentVersion,
                    savedAtIso = DateTime.UtcNow.ToString("o")
                };

                var tm = TimeManager.Instance;
                if (tm != null)
                {
                    data.year = tm.Year;
                    data.season = (int)tm.CurrentSeason;
                    data.day = tm.DayOfSeason;
                    data.hour = tm.Hour;
                    data.minute = tm.Minute;
                    data.totalMinutes = tm.TotalMinutes;
                }

                var ws = WeatherSystem.Instance;
                if (ws != null)
                {
                    data.weatherToday = (int)ws.Today;
                    data.weatherTomorrow = (int)ws.Tomorrow;
                    data.weatherAfter = (int)ws.DayAfter;
                }

                var player = GameObject.FindGameObjectWithTag("Player");
                if (player != null)
                {
                    data.playerPos = new float[] { player.transform.position.x, player.transform.position.y, player.transform.position.z };
                    data.playerYaw = player.transform.eulerAngles.y;
                    var interactor = player.GetComponent<Interaction.PlayerInteractor>();
                    if (interactor != null) data.waterCharges = interactor.WaterCharges;
                }

                if (Inventory.Instance != null) data.inventory = Inventory.Instance.GetSave();
                if (FarmGrid.Instance != null) data.tiles = FarmGrid.Instance.GetSave();

                if (npcRegistry != null)
                {
                    data.npcHeartPoints = npcRegistry.GetHeartPoints();
                    data.npcTalkedToday = npcRegistry.GetTalkedFlags();
                }

                string json = JsonUtility.ToJson(data, true);
                data.checksum = ComputeChecksum(json);
                json = JsonUtility.ToJson(data, true);

                File.WriteAllText(PathFor(slot), json);
                Debug.Log($"[Save] Đã lưu vào slot {slot}: {PathFor(slot)}");
                return true;
            }
            catch (Exception e)
            {
                Debug.LogError("[Save] Lỗi khi lưu: " + e.Message);
                return false;
            }
        }

        // ------------------------------------------------------------------
        public static bool Load(int slot, CropData[] cropDatabase, NPCRegistry npcRegistry = null)
        {
            string path = PathFor(slot);
            if (!File.Exists(path))
            {
                Debug.LogWarning("[Save] Không tìm thấy file save: " + path);
                return false;
            }

            try
            {
                string json = File.ReadAllText(path);
                var data = JsonUtility.FromJson<SaveData>(json);
                if (data == null) return false;

                data = Migrate(data);

                TimeManager.Instance?.LoadFrom(data.year, (Season)data.season, data.day, data.hour, data.minute, data.totalMinutes);

                if (WeatherSystem.Instance != null)
                    WeatherSystem.Instance.ForceWeather((WeatherType)data.weatherToday);

                if (Inventory.Instance != null)
                    Inventory.Instance.LoadSave(data.inventory, id => FindById(cropDatabase, id));

                if (FarmGrid.Instance != null)
                    FarmGrid.Instance.LoadSave(data.tiles, id => FindCropById(cropDatabase, id));

                var player = GameObject.FindGameObjectWithTag("Player");
                if (player != null && data.playerPos != null && data.playerPos.Length == 3)
                {
                    var cc = player.GetComponent<CharacterController>();
                    if (cc != null) cc.enabled = false;   // tránh bị đẩy xuyên địa hình khi teleport
                    player.transform.position = new Vector3(data.playerPos[0], data.playerPos[1], data.playerPos[2]);
                    player.transform.rotation = Quaternion.Euler(0f, data.playerYaw, 0f);
                    if (cc != null) cc.enabled = true;

                    var interactor = player.GetComponent<Interaction.PlayerInteractor>();
                    if (interactor != null && data.waterCharges > 0) interactor.RefillWater();
                }

                if (npcRegistry != null)
                {
                    npcRegistry.LoadHeartPoints(data.npcHeartPoints);
                    npcRegistry.LoadTalkedFlags(data.npcTalkedToday);
                }

                Debug.Log("[Save] Đã tải slot " + slot);
                return true;
            }
            catch (Exception e)
            {
                Debug.LogError("[Save] Lỗi khi tải: " + e.Message);
                return false;
            }
        }

        // ------------------------------------------------------------------
        public static bool HasSave(int slot) => File.Exists(PathFor(slot));

        public static void Delete(int slot)
        {
            string p = PathFor(slot);
            if (File.Exists(p)) File.Delete(p);
        }

        /// <summary>Tự động lưu khi ngủ (được gọi bởi BedInteractable).</summary>
        public static void AutoSaveOnSleep(CropData[] db)
        {
            Save(0, db);
        }

        // ------------------------------------------------------------------
        private static SaveData Migrate(SaveData data)
        {
            // Ví dụ: if (data.saveVersion < 2) { data.somethingNew = default; data.saveVersion = 2; }
            if (data.saveVersion < CurrentVersion) data.saveVersion = CurrentVersion;
            return data;
        }

        private static string ComputeChecksum(string json)
        {
            using (var md5 = System.Security.Cryptography.MD5.Create())
            {
                byte[] bytes = System.Text.Encoding.UTF8.GetBytes(json);
                byte[] hash = md5.ComputeHash(bytes);
                return BitConverter.ToString(hash).Replace("-", "").Substring(0, 8);
            }
        }

        private static ItemData FindById(CropData[] db, string itemId)
        {
            if (string.IsNullOrEmpty(itemId)) return null;
            if (ItemDatabase.Instance != null) return ItemDatabase.Instance.Find(itemId);
            return null;
        }

        private static CropData FindCropById(CropData[] db, string cropId)
        {
            if (string.IsNullOrEmpty(cropId)) return null;
            if (CropDatabase.Instance != null) return CropDatabase.Instance.Find(cropId);
            if (db != null) foreach (var c in db) if (c != null && c.cropId == cropId) return c;
            return null;
        }
    }

    // -------------------------------------------------------------------------
    //  CSDL ScriptableObject — dùng để tra cứu khi load save
    // -------------------------------------------------------------------------
    [CreateAssetMenu(fileName = "CropDatabase", menuName = "Vườn Mơ/Crop Database")]
    public class CropDatabase : ScriptableObject
    {
        public static CropDatabase Instance;
        public List<CropData> crops = new List<CropData>();
        private void OnEnable() => Instance = this;
        public CropData Find(string id) => crops.Find(c => c != null && c.cropId == id);
    }

    [CreateAssetMenu(fileName = "ItemDatabase", menuName = "Vườn Mơ/Item Database")]
    public class ItemDatabase : ScriptableObject
    {
        public static ItemDatabase Instance;
        public List<ItemData> items = new List<ItemData>();
        private void OnEnable() => Instance = this;
        public ItemData Find(string id) => items.Find(i => i != null && i.itemId == id);
    }
}
