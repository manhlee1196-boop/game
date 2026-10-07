// ============================================================================
//  FarmGrid.cs — Hệ thống lưới (Grid System) 2×2 m: quản lý ô đất, tra cứu toạ độ,
//                đặt công trình có snap + preview xanh/đỏ.
//  Đặt tại: Assets/Scripts/Farming/
//  Gắn vào: GameObject "FarmGrid" (chứa toàn bộ tile con)
// ============================================================================
using System.Collections.Generic;
using UnityEngine;
using VuonMo.Core;

namespace VuonMo.Farming
{
    public class FarmGrid : MonoBehaviour
    {
        public static FarmGrid Instance { get; private set; }

        [Header("Kích thước lưới")]
        public float tileSize = 2f;
        public int width = 60;      // 60 ô = 120 m
        public int height = 60;

        [Header("Sinh ô đất tự động (tuỳ chọn)")]
        public bool generateOnStart = false;
        public GameObject tilePrefab;

        [Header("Đặt công trình")]
        public LayerMask buildBlockMask = ~0;
        public Color validColor = new Color(0.35f, 1f, 0.45f, 0.55f);
        public Color invalidColor = new Color(1f, 0.35f, 0.35f, 0.55f);

        private readonly Dictionary<Vector2Int, FarmTile> _tiles = new Dictionary<Vector2Int, FarmTile>();
        private readonly Dictionary<Vector2Int, GameObject> _buildings = new Dictionary<Vector2Int, GameObject>();
        private GameObject _previewGhost;
        private bool _building;

        public IReadOnlyDictionary<Vector2Int, FarmTile> Tiles => _tiles;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
        }

        private void Start()
        {
            RegisterExistingTiles();
            if (generateOnStart && tilePrefab != null) GenerateGrid();
        }

        // ------------------------------------------------------------------
        //  ĐĂNG KÝ / SINH LƯỚI
        // ------------------------------------------------------------------
        private void RegisterExistingTiles()
        {
            foreach (var tile in GetComponentsInChildren<FarmTile>(true))
            {
                Vector2Int coord = WorldToGrid(tile.transform.position);
                tile.gridCoord = coord;
                tile.tileSize = tileSize;
                if (!_tiles.ContainsKey(coord)) _tiles.Add(coord, tile);
            }
        }

        public void GenerateGrid()
        {
            for (int x = 0; x < width; x++)
            {
                for (int y = 0; y < height; y++)
                {
                    Vector2Int coord = new Vector2Int(x, y);
                    if (_tiles.ContainsKey(coord)) continue;

                    Vector3 pos = GridToWorld(coord);
                    GameObject go = Instantiate(tilePrefab, pos, Quaternion.identity, transform);
                    go.name = $"Tile_{x}_{y}";
                    var tile = go.GetComponent<FarmTile>() ?? go.AddComponent<FarmTile>();
                    tile.gridCoord = coord;
                    tile.tileSize = tileSize;
                    _tiles[coord] = tile;
                }
            }
        }

        // ------------------------------------------------------------------
        //  CHUYỂN ĐỔI TOẠ ĐỘ
        // ------------------------------------------------------------------
        public Vector2Int WorldToGrid(Vector3 world)
        {
            int x = Mathf.FloorToInt(world.x / tileSize);
            int y = Mathf.FloorToInt(world.z / tileSize);
            return new Vector2Int(x, y);
        }

        public Vector3 GridToWorld(Vector2Int coord)
            => new Vector3((coord.x + 0.5f) * tileSize, 0f, (coord.y + 0.5f) * tileSize);

        /// <summary>Lấy ô đất tại toạ độ thế giới (null nếu ngoài lưới).</summary>
        public FarmTile GetTile(Vector3 worldPos)
        {
            Vector2Int c = WorldToGrid(worldPos);
            return _tiles.TryGetValue(c, out var tile) ? tile : null;
        }

        /// <summary>Lấy tất cả ô trong một vùng chữ nhật (dùng cho máy gặt, máy cày).</summary>
        public List<FarmTile> GetTilesInArea(Vector3 center, int cellsX, int cellsZ)
        {
            var result = new List<FarmTile>();
            Vector2Int origin = WorldToGrid(center);
            for (int x = 0; x < cellsX; x++)
                for (int z = 0; z < cellsZ; z++)
                {
                    var c = new Vector2Int(origin.x + x, origin.y + z);
                    if (_tiles.TryGetValue(c, out var t)) result.Add(t);
                }
            return result;
        }

        // ------------------------------------------------------------------
        //  ĐẶT CÔNG TRÌNH (BUILD MODE)
        // ------------------------------------------------------------------

        /// <summary>Bật chế độ đặt công trình với "bóng ma" preview.</summary>
        public void BeginBuild(GameObject buildingPrefab, Vector2Int footprint)
        {
            CancelBuild();
            _building = true;
            _previewGhost = Instantiate(buildingPrefab);
            _previewFootprint = footprint;
            SetGhostTransparency(_previewGhost, true);
        }

        public void CancelBuild()
        {
            _building = false;
            if (_previewGhost != null) Destroy(_previewGhost);
            _previewGhost = null;
        }

        private Vector2Int _previewFootprint = Vector2Int.one;

        public void UpdateBuildPreview(Vector3 mouseWorldPos, bool rotate90)
        {
            if (!_building || _previewGhost == null) return;

            if (rotate90) _previewFootprint = new Vector2Int(_previewFootprint.y, _previewFootprint.x);

            Vector2Int origin = WorldToGrid(mouseWorldPos);
            Vector3 snapped = GridToWorld(origin);
            snapped.y = 0f;

            _previewGhost.transform.position = Vector3.Lerp(_previewGhost.transform.position, snapped, Time.deltaTime * 18f);
            _previewGhost.transform.rotation = Quaternion.Euler(0f, _previewFootprint.x > _previewFootprint.y ? 90f : 0f, 0f);

            bool valid = IsAreaFree(origin, _previewFootprint);
            SetGhostColor(_previewGhost, valid ? validColor : invalidColor);
        }

        /// <summary>Kiểm tra vùng có trống để xây không (không cây, không công trình, đất phẳng).</summary>
        public bool IsAreaFree(Vector2Int origin, Vector2Int footprint)
        {
            for (int x = 0; x < footprint.x; x++)
                for (int z = 0; z < footprint.y; z++)
                {
                    var c = new Vector2Int(origin.x + x, origin.y + z);
                    if (!_tiles.TryGetValue(c, out var tile)) return false;
                    if (tile.crop != null) return false;
                    if (_buildings.ContainsKey(c)) return false;
                    if (tile.State == TileState.Blocked) return false;

                    // Kiểm tra vật cản vật lý (cây, đá, nhà có sẵn)
                    Vector3 center = GridToWorld(c) + Vector3.up * 1f;
                    if (Physics.CheckBox(center, new Vector3(tileSize * 0.45f, 1f, tileSize * 0.45f), Quaternion.identity, buildBlockMask))
                        return false;
                }
            return true;
        }

        /// <summary>Đặt công trình thật sự (trả về GameObject mới hoặc null).</summary>
        public GameObject PlaceBuilding(GameObject buildingPrefab, Vector2Int origin, Vector2Int footprint, bool rotated)
        {
            if (!IsAreaFree(origin, footprint))
            {
                if (FloatingText.Instance != null) FloatingText.Instance.ShowToast("Không đủ chỗ để xây!");
                return null;
            }

            Vector3 pos = GridToWorld(origin);
            GameObject go = Instantiate(buildingPrefab, pos, Quaternion.Euler(0f, rotated ? 90f : 0f, 0f), transform);

            for (int x = 0; x < footprint.x; x++)
                for (int z = 0; z < footprint.y; z++)
                {
                    var c = new Vector2Int(origin.x + x, origin.y + z);
                    _buildings[c] = go;
                    if (_tiles.TryGetValue(c, out var tile))
                    {
                        tile.LoadState((int)TileState.Blocked, 0f, tile.Nutrients, 0, false);
                    }
                }

            if (AudioManager.Instance != null) AudioManager.Instance.PlayOneShot(AudioManager.Instance.pickUp, 0.9f);
            CancelBuild();
            return go;
        }

        /// <summary>Gỡ công trình, trả lại đất cỏ.</summary>
        public void RemoveBuilding(GameObject building)
        {
            if (building == null) return;
            var toRemove = new List<Vector2Int>();
            foreach (var kv in _buildings) if (kv.Value == building) toRemove.Add(kv.Key);
            foreach (var c in toRemove)
            {
                _buildings.Remove(c);
                if (_tiles.TryGetValue(c, out var tile))
                    tile.LoadState((int)TileState.Grass, 0f, tile.Nutrients, 0, false);
            }
            Destroy(building);
        }

        // ------------------------------------------------------------------
        private void SetGhostTransparency(GameObject ghost, bool transparent)
        {
            foreach (var r in ghost.GetComponentsInChildren<Renderer>())
            {
                var mats = r.materials;
                foreach (var m in mats) SetMaterialTransparent(m);
            }
        }

        private void SetGhostColor(GameObject ghost, Color color)
        {
            foreach (var r in ghost.GetComponentsInChildren<Renderer>())
            {
                var mpb = new MaterialPropertyBlock();
                r.GetPropertyBlock(mpb);
                mpb.SetColor("_BaseColor", color);
                mpb.SetColor("_Color", color);
                r.SetPropertyBlock(mpb);
            }
        }

        private void SetMaterialTransparent(Material m)
        {
            if (m == null) return;
            // URP Standard/Lit: bật chế độ trong suốt
            m.SetFloat("_Surface", 1f);
            m.SetFloat("_Blend", 0f);
            m.SetFloat("_AlphaClip", 0f);
            m.renderQueue = (int)UnityEngine.Rendering.RenderQueue.Transparent;
            if (m.HasProperty("_BaseColor")) { var c = m.GetColor("_BaseColor"); c.a = 0.55f; m.SetColor("_BaseColor", c); }
            if (m.HasProperty("_Color")) { var c = m.GetColor("_Color"); c.a = 0.55f; m.SetColor("_Color", c); }
        }

        // ------------------------------------------------------------------
        //  LƯU / TẢI
        // ------------------------------------------------------------------
        [System.Serializable]
        public struct TileSave
        {
            public int x, y;
            public int state;
            public float moisture;
            public float nutrients;
            public int weeds;
            public bool pest;
            public string cropId;
            public int wateredDays;
            public int cropStage;
            public int cropQuality;
            public bool cropDead;
        }

        public List<TileSave> GetSave()
        {
            var list = new List<TileSave>();
            foreach (var kv in _tiles)
            {
                var t = kv.Value;
                var ts = new TileSave
                {
                    x = kv.Key.x, y = kv.Key.y,
                    state = (int)t.State,
                    moisture = t.moisture,
                    nutrients = t.nutrients,
                    weeds = t.weedLevel,
                    pest = t.hasPest
                };

                if (t.crop != null && t.crop.Data != null)
                {
                    var cs = t.crop.GetSave();
                    ts.cropId = cs.cropId;
                    ts.wateredDays = cs.wateredDays;
                    ts.cropStage = cs.stageIndex;
                    ts.cropQuality = cs.qualityIndex;
                    ts.cropDead = cs.dead;
                }
                list.Add(ts);
            }
            return list;
        }

        /// <summary>Tải lại toàn bộ ruộng từ file save. <paramref name="lookup"/> tra CropData theo cropId.</summary>
        public void LoadSave(List<TileSave> list, System.Func<string, CropData> lookup)
        {
            foreach (var entry in list)
            {
                var coord = new Vector2Int(entry.x, entry.y);
                if (!_tiles.TryGetValue(coord, out var tile)) continue;

                // Xoá cây cũ nếu có
                if (tile.crop != null) tile.ClearCrop(true);

                tile.LoadState(entry.state, entry.moisture, entry.nutrients, entry.weeds, entry.pest);

                if (!string.IsNullOrEmpty(entry.cropId))
                {
                    var data = lookup?.Invoke(entry.cropId);
                    if (data == null) continue;

                    var instance = tile.Plant(data);
                    if (instance != null)
                    {
                        instance.LoadSave(new CropInstance.CropSave
                        {
                            cropId = entry.cropId,
                            wateredDays = entry.wateredDays,
                            stageIndex = entry.cropStage,
                            qualityIndex = entry.cropQuality,
                            dead = entry.cropDead
                        }, data, tile, TimeManager.Instance.CurrentSeason);
                    }
                }
            }
        }
    }
}
