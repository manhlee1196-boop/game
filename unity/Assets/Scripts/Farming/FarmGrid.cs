// ============================================================================
//  FarmGrid.cs — Lưới đất 2D (Tilemap + mảng dữ liệu) cho game pixel top-down
//  Đặt tại: Assets/Scripts/Farming/
//  Gắn vào: GameObject "FarmGrid" (cha của các Tilemap)
//
//  Kiến trúc: KHÔNG tạo 1 GameObject cho mỗi ô đất (tốn RAM, lag khi map lớn).
//  Thay vào đó:
//    · Tilemap lo phần HÌNH ẢNH (cỏ / đất cuốc / đất tưới / cỏ dại)
//    · Mảng struct TileData lo phần DỮ LIỆU (độ ẩm, dinh dưỡng, cỏ dại, sâu bệnh)
//  → 1 bản đồ 200×200 ô = 40.000 ô chỉ tốn vài KB, chạy 60 fps trên cả Switch.
// ============================================================================
using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Tilemaps;
using VuonMo.Core;
using VuonMo.Data;

namespace VuonMo.Farming
{
    /// <summary>Dữ liệu 1 ô đất (struct → nằm liền trong mảng, không tốn GC).</summary>
    [Serializable]
    public struct TileData
    {
        public TileState state;
        public float moisture;      // 0–1
        public float nutrients;     // 0–1
        public byte weedLevel;      // 0–3
        public bool hasPest;
        public bool isGreenhouse;

        public static TileData Default => new TileData
        {
            state = TileState.Grass,
            moisture = 0f,
            nutrients = 0.6f,
            weedLevel = 0,
            hasPest = false,
            isGreenhouse = false
        };
    }

    public class FarmGrid : MonoBehaviour
    {
        public static FarmGrid Instance { get; private set; }

        [Header("Lưới")]
        [Tooltip("Gốc lưới (ô 0,0 nằm ở góc dưới-trái).")]
        public Vector3Int originCell = new Vector3Int(0, 0, 0);
        public int width = 80;
        public int height = 80;

        [Header("Tilemap (HÌNH ẢNH)")]
        [Tooltip("Lớp nền: cỏ, đường đất, nước.")]
        public Tilemap groundTilemap;
        [Tooltip("Lớp đất nông nghiệp: đất đã cuốc / đã tưới.")]
        public Tilemap soilTilemap;
        [Tooltip("Lớp trang trí: cỏ dại, hoa, vật nhỏ.")]
        public Tilemap decorTilemap;

        [Header("Tile asset")]
        public TileBase grassTile;
        public TileBase tilledTile;
        public TileBase wateredTile;
        public TileBase weedTile;
        public TileBase pestTile;

        [Header("Cây trồng")]
        [Tooltip("Prefab cây trống: có SpriteRenderer + CropInstance (sprite sẽ được gán khi tạo).")]
        public GameObject cropPrefab;
        [Tooltip("Node cha chứa mọi cây trồng.")]
        public Transform cropParent;

        [Header("Cân bằng")]
        [Tooltip("Lượng ẩm mất mỗi ngày.")]
        public float dailyMoistureLoss = 0.35f;
        [Tooltip("Lượng ẩm nhận mỗi lần tưới.")]
        public float waterPerUse = 0.4f;
        [Tooltip("Dinh dưỡng mất mỗi vụ thu hoạch.")]
        public float nutrientLossPerHarvest = 0.05f;
        [Tooltip("Tỉ lệ mọc cỏ dại mỗi ngày.")]
        public float weedChancePerDay = 0.04f;
        [Tooltip("Tỉ lệ sâu bệnh khi đất bạc màu.")]
        public float pestChancePerDay = 0.02f;

        [Header("Mùa")]
        public SeasonTheme currentTheme;      // gán tự động khi mùa đổi

        // ------------------------------------------------------------------
        private TileData[] _tiles;
        private CropInstance[] _crops;
        private SeasonTheme[] _themes;         // 4 theme, gán trong Inspector

        public event Action<Vector3Int> OnTileChanged;

        // ==================================================================
        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;

            _tiles = new TileData[width * height];
            _crops = new CropInstance[width * height];
            for (int i = 0; i < _tiles.Length; i++) _tiles[i] = TileData.Default;
        }

        private void Start()
        {
            if (cropParent == null) cropParent = transform;

            if (TimeManager.Instance != null)
            {
                TimeManager.Instance.OnDayChanged += HandleNewDay;
                TimeManager.Instance.OnSeasonChanged += HandleSeasonChanged;
            }
            if (WeatherSystem.Instance != null)
                WeatherSystem.Instance.OnWeatherChanged += (now, old) => { /* VFX do WeatherFX2D lo */ };

            ApplySeasonTheme(TimeManager.Instance != null ? TimeManager.Instance.CurrentSeason : Season.Spring);
        }

        private void OnDestroy()
        {
            if (TimeManager.Instance != null)
            {
                TimeManager.Instance.OnDayChanged -= HandleNewDay;
                TimeManager.Instance.OnSeasonChanged -= HandleSeasonChanged;
            }
        }

        // ==================================================================
        //  TRUY CẬP Ô
        // ==================================================================

        private int Index(Vector3Int cell)
        {
            int x = cell.x - originCell.x;
            int y = cell.y - originCell.y;
            if (x < 0 || y < 0 || x >= width || y >= height) return -1;
            return y * width + x;
        }

        public bool InBounds(Vector3Int cell) => Index(cell) >= 0;

        /// <summary>Lấy dữ liệu ô (null nếu ngoài lưới).</summary>
        public TileData? GetTile(Vector3Int cell)
        {
            int i = Index(cell);
            return i < 0 ? (TileData?)null : _tiles[i];
        }

        public CropInstance GetCrop(Vector3Int cell)
        {
            int i = Index(cell);
            return i < 0 ? null : _crops[i];
        }

        /// <summary>Tâm ô trong không gian world (ô 1×1 world unit).</summary>
        public Vector3 CellCenter(Vector3Int cell)
            => new Vector3(cell.x + 0.5f, cell.y + 0.5f, 0f);

        /// <summary>World → cell.</summary>
        public Vector3Int WorldToCell(Vector3 world)
            => new Vector3Int(Mathf.FloorToInt(world.x), Mathf.FloorToInt(world.y), 0);

        private void SetTile(int index, TileData data)
        {
            _tiles[index] = data;
            RefreshTileVisual(index);
        }

        private Vector3Int CellFromIndex(int index)
        {
            int y = index / width;
            int x = index % width;
            return new Vector3Int(originCell.x + x, originCell.y + y, 0);
        }

        /// <summary>Cập nhật lại tilemap cho 1 ô (đất cuốc / đất tưới / cỏ dại / sâu bệnh).</summary>
        private void RefreshTileVisual(int index)
        {
            if (soilTilemap == null) return;

            var cell = CellFromIndex(index);
            var data = _tiles[index];
            TileBase soil = null;

            switch (data.state)
            {
                case TileState.Grass:
                    soil = null;
                    break;
                case TileState.Tilled:
                    soil = data.moisture >= 0.3f ? (wateredTile != null ? wateredTile : tilledTile) : tilledTile;
                    break;
                case TileState.Planted:
                    soil = data.moisture >= 0.3f ? (wateredTile != null ? wateredTile : tilledTile) : tilledTile;
                    break;
                case TileState.Blocked:
                    soil = null;
                    break;
            }
            soilTilemap.SetTile(cell, soil);

            if (decorTilemap != null)
            {
                TileBase decor = null;
                if (data.hasPest && pestTile != null) decor = pestTile;
                else if (data.weedLevel > 0 && weedTile != null) decor = weedTile;
                decorTilemap.SetTile(cell, decor);
            }

            OnTileChanged?.Invoke(cell);
        }

        // ==================================================================
        //  HÀNH ĐỘNG TRÊN ĐẤT
        // ==================================================================

        public bool Till(Vector3Int cell)
        {
            int i = Index(cell);
            if (i < 0) return false;
            var d = _tiles[i];
            if (d.state != TileState.Grass) return false;

            d.state = TileState.Tilled;
            d.weedLevel = 0;
            SetTile(i, d);
            return true;
        }

        public bool Water(Vector3Int cell, float amount = -1f)
        {
            int i = Index(cell);
            if (i < 0) return false;
            var d = _tiles[i];
            if (d.state == TileState.Grass || d.state == TileState.Blocked) return false;

            float add = amount > 0f ? amount : waterPerUse;
            d.moisture = Mathf.Clamp01(d.moisture + add);
            SetTile(i, d);
            return true;
        }

        public void ClearWeeds(Vector3Int cell)
        {
            int i = Index(cell);
            if (i < 0) return;
            var d = _tiles[i];
            d.weedLevel = 0;
            d.hasPest = false;
            SetTile(i, d);
        }

        public void Fertilize(Vector3Int cell, float amount = 0.3f)
        {
            int i = Index(cell);
            if (i < 0) return;
            var d = _tiles[i];
            d.nutrients = Mathf.Clamp01(d.nutrients + amount);
            d.hasPest = false;
            SetTile(i, d);
        }

        // ==================================================================
        //  GIEO TRỒNG
        // ==================================================================

        public bool CanPlant(Vector3Int cell, CropData data, Season season, out string reason)
        {
            reason = "";
            var tile = GetTile(cell);
            if (tile == null) { reason = "Ngoài khu vực canh tác."; return false; }

            if (tile.Value.state == TileState.Grass) { reason = "Cần cuốc đất trước (phím 1)."; return false; }
            if (tile.Value.state == TileState.Blocked) { reason = "Ô này bị chặn."; return false; }
            if (tile.Value.state == TileState.Planted) { reason = "Ô này đã có cây."; return false; }
            if (data == null) { reason = "Chưa chọn hạt giống."; return false; }
            if (!data.CanPlantInSeason(season)) { reason = $"{data.displayName} không trồng được mùa này."; return false; }
            if (season == Season.Winter && !data.survivesWinterOutdoor && !tile.Value.isGreenhouse)
            {
                reason = "Mùa Đông: hãy trồng trong nhà kính.";
                return false;
            }
            return true;
        }

        /// <summary>Tạo cây mới tại ô (dùng cropPrefab hoặc tự dựng GameObject).</summary>
        public CropInstance Plant(Vector3Int cell, CropData data)
        {
            int i = Index(cell);
            if (i < 0 || data == null) return null;

            var d = _tiles[i];
            if (d.state != TileState.Tilled) return null;

            GameObject go;
            if (cropPrefab != null)
            {
                go = Instantiate(cropPrefab, CellCenter(cell), Quaternion.identity, cropParent);
            }
            else
            {
                go = new GameObject($"Crop_{data.cropId}");
                go.transform.SetParent(cropParent, false);
                go.transform.position = CellCenter(cell);
                go.AddComponent<SpriteRenderer>();
            }
            go.name = $"Crop_{data.cropId}_{cell.x}_{cell.y}";

            var crop = go.GetComponent<CropInstance>() ?? go.AddComponent<CropInstance>();
            crop.Initialize(data, this, cell, TimeManager.Instance != null ? TimeManager.Instance.CurrentSeason : Season.Spring);

            _crops[i] = crop;
            d.state = TileState.Planted;
            SetTile(i, d);
            return crop;
        }

        public void ClearCrop(Vector3Int cell, bool keepTilled = true, bool consumeNutrients = false)
        {
            int i = Index(cell);
            if (i < 0) return;

            if (_crops[i] != null)
            {
                Destroy(_crops[i].gameObject);
                _crops[i] = null;
            }

            var d = _tiles[i];
            d.state = keepTilled ? TileState.Tilled : TileState.Grass;
            if (consumeNutrients) d.nutrients = Mathf.Clamp01(d.nutrients - nutrientLossPerHarvest);
            SetTile(i, d);
        }

        /// <summary>Được CropInstance gọi khi cây bị nhổ/chết.</summary>
        public void NotifyCropRemoved(Vector3Int cell, CropInstance crop)
        {
            int i = Index(cell);
            if (i < 0) return;
            if (_crops[i] == crop) _crops[i] = null;
        }

        /// <summary>Dinh dưỡng đất (dùng để tính phẩm chất khi thu hoạch).</summary>
        public float GetNutrients(Vector3Int cell)
        {
            var t = GetTile(cell);
            return t.HasValue ? t.Value.nutrients : 0.5f;
        }

        public float GetMoisture(Vector3Int cell)
        {
            var t = GetTile(cell);
            return t.HasValue ? t.Value.moisture : 0f;
        }

        // ==================================================================
        //  VÒNG NGÀY: ẨM / CỎ DẠI / SÂU BỆNH
        // ==================================================================
        private void HandleNewDay(int dayIndex, Season season)
        {
            bool raining = WeatherSystem.Instance != null && WeatherSystem.Instance.IsRaining();

            for (int i = 0; i < _tiles.Length; i++)
            {
                var d = _tiles[i];
                if (d.state == TileState.Grass || d.state == TileState.Blocked) continue;

                d.moisture = raining ? 1f : Mathf.Clamp01(d.moisture - dailyMoistureLoss);
                if (d.moisture < 0.05f) d.moisture = 0f;

                if (UnityEngine.Random.value < weedChancePerDay && d.weedLevel < 3) d.weedLevel++;

                if (!d.hasPest && d.nutrients < 0.4f && UnityEngine.Random.value < pestChancePerDay) d.hasPest = true;

                _tiles[i] = d;
                RefreshTileVisual(i);
            }
        }

        private void HandleSeasonChanged(Season season) => ApplySeasonTheme(season);

        /// <summary>Đổi tile + màu nền theo mùa (rẻ hơn nhiều so với vẽ lại bản đồ).</summary>
        public void ApplySeasonTheme(Season season)
        {
            if (_themes != null)
            {
                foreach (var t in _themes)
                {
                    if (t != null && t.season == season) { currentTheme = t; break; }
                }
            }
            if (currentTheme == null) return;

            if (currentTheme.grassTile != null) grassTile = currentTheme.grassTile;
            if (currentTheme.tilledTile != null) tilledTile = currentTheme.tilledTile;
            if (currentTheme.wateredTile != null) wateredTile = currentTheme.wateredTile;

            // Đổi toàn bộ ô cỏ nền sang tile của mùa mới
            if (groundTilemap != null && grassTile != null)
            {
                for (int x = 0; x < width; x++)
                    for (int y = 0; y < height; y++)
                    {
                        var cell = new Vector3Int(originCell.x + x, originCell.y + y, 0);
                        var current = groundTilemap.GetTile(cell);
                        // chỉ đổi những ô cỏ (không đổi đường đất/nước)
                        if (current != null) groundTilemap.SetTile(cell, grassTile);
                    }
            }

            // Cập nhật lại lớp đất nông nghiệp
            for (int i = 0; i < _tiles.Length; i++) RefreshTileVisual(i);
        }

        /// <summary>Gán 4 theme mùa (gọi trong Inspector hoặc từ script khởi tạo).</summary>
        public void SetThemes(params SeasonTheme[] themes) => _themes = themes;

        // ==================================================================
        //  LƯU / TẢI
        // ==================================================================
        [Serializable]
        public struct TileSave
        {
            public int x, y;
            public int state;
            public float moisture;
            public float nutrients;
            public byte weeds;
            public bool pest;
            // dữ liệu cây (nếu có)
            public string cropId;
            public int wateredDays;
            public int cropStage;
            public int cropQuality;
            public bool cropDead;
        }

        public List<TileSave> GetSave()
        {
            var list = new List<TileSave>();
            for (int i = 0; i < _tiles.Length; i++)
            {
                var d = _tiles[i];
                var cell = CellFromIndex(i);
                var entry = new TileSave
                {
                    x = cell.x, y = cell.y,
                    state = (int)d.state,
                    moisture = d.moisture,
                    nutrients = d.nutrients,
                    weeds = d.weedLevel,
                    pest = d.hasPest
                };
                if (_crops[i] != null && _crops[i].Data != null)
                {
                    var cs = _crops[i].GetSave();
                    entry.cropId = cs.cropId;
                    entry.wateredDays = cs.wateredDays;
                    entry.cropStage = cs.stageIndex;
                    entry.cropQuality = cs.qualityIndex;
                    entry.cropDead = cs.dead;
                }
                list.Add(entry);
            }
            return list;
        }

        public void LoadSave(List<TileSave> list, Func<string, CropData> lookupCrop)
        {
            if (list == null) return;
            for (int i = 0; i < _tiles.Length; i++) ClearCrop(CellFromIndex(i), false);

            foreach (var entry in list)
            {
                var cell = new Vector3Int(entry.x, entry.y, 0);
                int i = Index(cell);
                if (i < 0) continue;

                var d = TileData.Default;
                d.state = (TileState)entry.state;
                d.moisture = entry.moisture;
                d.nutrients = entry.nutrients;
                d.weedLevel = entry.weeds;
                d.hasPest = entry.pest;
                _tiles[i] = d;

                if (!string.IsNullOrEmpty(entry.cropId))
                {
                    var data = lookupCrop?.Invoke(entry.cropId);
                    if (data != null)
                    {
                        var crop = Plant(cell, data);
                        if (crop != null)
                        {
                            crop.LoadSave(new CropInstance.CropSave
                            {
                                cropId = entry.cropId,
                                wateredDays = entry.wateredDays,
                                stageIndex = entry.cropStage,
                                qualityIndex = entry.cropQuality,
                                dead = entry.cropDead
                            }, data, this, cell);
                        }
                    }
                }
                RefreshTileVisual(i);
            }
        }
    }
}
