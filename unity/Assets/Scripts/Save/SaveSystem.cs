// ============================================================================
//  SaveSystem.cs — Lưu/tải JSON cho game 2D pixel (3 khe + checksum + migrate)
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
using VuonMo.Player;

namespace VuonMo.SaveSystem
{
    [Serializable]
    public class SaveData
    {
        public int saveVersion = 2;
        public string savedAtIso;

        // Thời gian
        public int year = 1;
        public int season = 0;
        public int day = 1;
        public int hour = 6;
        public int minute = 0;
        public double totalMinutes;
        public bool wellRested;

        // Thời tiết (dự báo 3 ngày)
        public int weatherToday, weatherTomorrow, weatherAfter;

        // Người chơi
        public float playerX, playerY;
        public int playerFacing;
        public int waterCharges = 20;
        public int selectedTool = 0;
        public string selectedSeedId = "";

        // Dữ liệu lớn
        public Inventory.SaveData inventory = new Inventory.SaveData();
        public List<FarmGrid.TileSave> tiles = new List<FarmGrid.TileSave>();

        // Cộng đồng
        public List<int> npcHeartPoints = new List<int>();

        // Tiến trình
        public int farmingXp;
        public int farmingLevel = 1;

        public string checksum = "";
    }

    public static class SaveSystem
    {
        public const int CurrentVersion = 2;
        private const string FolderName = "VuonMoSaves";

        private static string Folder => Path.Combine(Application.persistentDataPath, FolderName);
        public static string PathFor(int slot) => Path.Combine(Folder, $"slot{slot}.json");

        // ==================================================================
        //  LƯU
        // ==================================================================
        public static bool Save(int slot, CropDatabase cropDatabase = null)
        {
            try
            {
                Directory.CreateDirectory(Folder);

                var data = new SaveData { saveVersion = CurrentVersion, savedAtIso = DateTime.UtcNow.ToString("o") };

                // --- Thời gian ---
                var tm = TimeManager.Instance;
                if (tm != null)
                {
                    data.year = tm.Year;
                    data.season = (int)tm.CurrentSeason;
                    data.day = tm.DayOfSeason;
                    data.hour = tm.Hour;
                    data.minute = tm.Minute;
                    data.totalMinutes = tm.TotalMinutes;
                    data.wellRested = tm.wellRestedBuff;
                }

                // --- Thời tiết ---
                var ws = WeatherSystem.Instance;
                if (ws != null)
                {
                    data.weatherToday = (int)ws.Today;
                    data.weatherTomorrow = (int)ws.Tomorrow;
                    data.weatherAfter = (int)ws.DayAfter;
                }

                // --- Người chơi ---
                var playerGo = GameObject.FindGameObjectWithTag("Player");
                if (playerGo != null)
                {
                    data.playerX = playerGo.transform.position.x;
                    data.playerY = playerGo.transform.position.y;

                    var motor = playerGo.GetComponent<PlayerController2D>();
                    if (motor != null) data.playerFacing = (int)motor.Facing;

                    var interactor = playerGo.GetComponent<PlayerInteractor2D>();
                    if (interactor != null)
                    {
                        data.waterCharges = interactor.WaterCharges;
                        data.selectedTool = (int)interactor.CurrentTool;
                        data.selectedSeedId = interactor.SelectedSeed != null ? interactor.SelectedSeed.cropId : "";
                    }
                }

                // --- Túi đồ, ruộng, NPC, XP ---
                if (Inventory.Instance != null) data.inventory = Inventory.Instance.GetSave();
                if (FarmGrid.Instance != null) data.tiles = FarmGrid.Instance.GetSave();
                if (NPCRegistry2D.Instance != null) data.npcHeartPoints = NPCRegistry2D.Instance.GetHeartPoints();
                if (PlayerStats.Instance != null)
                {
                    data.farmingXp = PlayerStats.Instance.farmingXp;
                    data.farmingLevel = PlayerStats.Instance.farmingLevel;
                }

                // --- Ghi file (có checksum) ---
                string json = JsonUtility.ToJson(data, true);
                data.checksum = ComputeChecksum(json);
                json = JsonUtility.ToJson(data, true);
                File.WriteAllText(PathFor(slot), json);

                Debug.Log($"[Save] Đã lưu slot {slot} → {PathFor(slot)}");
                return true;
            }
            catch (Exception e)
            {
                Debug.LogError("[Save] Lỗi khi lưu: " + e);
                return false;
            }
        }

        // ==================================================================
        //  TẢI
        // ==================================================================
        public static bool Load(int slot, CropDatabase cropDatabase = null)
        {
            string path = PathFor(slot);
            if (!File.Exists(path))
            {
                Debug.LogWarning("[Save] Không có file: " + path);
                return false;
            }

            try
            {
                var data = JsonUtility.FromJson<SaveData>(File.ReadAllText(path));
                if (data == null) return false;
                data = Migrate(data);

                // --- Thời gian ---
                TimeManager.Instance?.LoadFrom(data.year, (Season)data.season, data.day, data.hour, data.minute, data.totalMinutes);
                if (TimeManager.Instance != null) TimeManager.Instance.wellRestedBuff = data.wellRested;

                // --- Thời tiết ---
                if (WeatherSystem.Instance != null) WeatherSystem.Instance.ForceWeather((WeatherType)data.weatherToday);

                // --- Túi đồ ---
                if (Inventory.Instance != null)
                    Inventory.Instance.LoadSave(data.inventory, id => ItemDatabase.Instance != null ? ItemDatabase.Instance.Find(id) : null);

                // --- Ruộng ---
                if (FarmGrid.Instance != null)
                {
                    Func<string, CropData> lookup = id =>
                    {
                        if (CropDatabase.Instance != null)
                        {
                            var c = CropDatabase.Instance.Find(id);
                            if (c != null) return c;
                        }
                        if (cropDatabase != null) foreach (var c in cropDatabase.crops) if (c != null && c.cropId == id) return c;
                        return null;
                    };
                    FarmGrid.Instance.LoadSave(data.tiles, lookup);
                }

                // --- Người chơi ---
                var playerGo = GameObject.FindGameObjectWithTag("Player");
                if (playerGo != null)
                {
                    playerGo.transform.position = new Vector3(data.playerX, data.playerY, 0f);

                    var interactor = playerGo.GetComponent<PlayerInteractor2D>();
                    if (interactor != null)
                    {
                        if (data.waterCharges > 0) interactor.RefillWater();
                        interactor.SetTool((ToolType)data.selectedTool);
                        if (!string.IsNullOrEmpty(data.selectedSeedId) && CropDatabase.Instance != null)
                            interactor.SetSeed(CropDatabase.Instance.Find(data.selectedSeedId));
                    }
                }

                // --- NPC & XP ---
                if (NPCRegistry2D.Instance != null) NPCRegistry2D.Instance.LoadHeartPoints(data.npcHeartPoints);                if (PlayerStats.Instance != null)
                {
                    PlayerStats.Instance.farmingXp = data.farmingXp;
                    PlayerStats.Instance.farmingLevel = Mathf.Max(1, data.farmingLevel);
                }

                Debug.Log("[Save] Đã tải slot " + slot);
                return true;
            }
            catch (Exception e)
            {
                Debug.LogError("[Save] Lỗi khi tải: " + e);
                return false;
            }
        }

        // ==================================================================
        //  TIỆN ÍCH
        // ==================================================================
        public static bool HasSave(int slot) => File.Exists(PathFor(slot));

        public static void Delete(int slot)
        {
            string p = PathFor(slot);
            if (File.Exists(p)) File.Delete(p);
        }

        /// <summary>Thông tin tóm tắt để hiện ở menu "Tiếp tục" (không cần tải cả game).</summary>
        public static string GetSlotSummary(int slot)
        {
            if (!HasSave(slot)) return "— Trống —";
            try
            {
                var data = JsonUtility.FromJson<SaveData>(File.ReadAllText(PathFor(slot)));
                if (data == null) return "— Lỗi dữ liệu —";
                string[] seasons = { "Xuân", "Hạ", "Thu", "Đông" };
                string season = (data.season >= 0 && data.season < 4) ? seasons[data.season] : "?";
                return $"Năm {data.year} · {season} ngày {data.day} · {data.hour:00}:{data.minute:00} · {data.inventory.gold:N0} G";
            }
            catch { return "— Lỗi dữ liệu —"; }
        }

        private static SaveData Migrate(SaveData data)
        {
            // v1 (bản 3D) -> v2 (bản 2D): cấu trúc ô đất đổi toạ độ, nên bỏ ô không hợp lệ.
            if (data.saveVersion < 2)
            {
                data.tiles = new List<FarmGrid.TileSave>();
                data.saveVersion = 2;
                Debug.LogWarning("[Save] Đã migrate save từ v1 (3D) sang v2 (2D) — ruộng được làm mới.");
            }
            return data;
        }

        private static string ComputeChecksum(string json)
        {
            using (var md5 = System.Security.Cryptography.MD5.Create())
            {
                byte[] hash = md5.ComputeHash(System.Text.Encoding.UTF8.GetBytes(json));
                return BitConverter.ToString(hash).Replace("-", "").Substring(0, 8);
            }
        }
    }

    // -------------------------------------------------------------------------
    //  CSDL ScriptableObject (dùng để tra cứu khi load save / hiện UI)
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
