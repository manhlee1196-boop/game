// ============================================================================
//  StarterPlot2D.cs — Dọn sẵn một luống đất khi bắt đầu ván mới
//  Đặt tại: Assets/Scripts/Farming/
//  Gắn vào: GameObject "FarmGrid" (cùng object với FarmGrid)
//
//  Vì sao cần: người chơi mới phải bấm E cuốc từng ô (24 ô = 24 lần) rồi mới gieo
//  được — mất 5 phút đầu rất nhàm. Script này tự CUỐI + TƯỚI sẵn một luống nhỏ
//  khi vào game, đúng tinh thần "Câu chuyện 30 phút đầu" trong GDD §3.
//
//  Chạy SAU FarmGrid (execution order 50) để chắc chắn _tiles đã được cấp phát.
// ============================================================================
using UnityEngine;

namespace VuonMo.Farming
{
    [DefaultExecutionOrder(50)]
    public class StarterPlot2D : MonoBehaviour
    {
        [Header("Vùng đất dọn sẵn (toạ độ ô lưới)")]
        public Vector2Int from = new Vector2Int(6, 8);
        public Vector2Int size = new Vector2Int(6, 4);

        [Header("Dọn gì")]
        public bool till = true;
        public bool water = true;
        public bool clearWeeds = true;

        private void Start()
        {
            FarmGrid grid = FarmGrid.Instance != null ? FarmGrid.Instance : GetComponent<FarmGrid>();
            if (grid == null)
            {
                Debug.LogWarning("[StarterPlot2D] Không tìm thấy FarmGrid — bỏ qua.");
                return;
            }

            int done = 0;
            for (int y = from.y; y < from.y + size.y; y++)
            {
                for (int x = from.x; x < from.x + size.x; x++)
                {
                    Vector3Int cell = new Vector3Int(x, y, 0);

                    if (clearWeeds) grid.ClearWeeds(cell);
                    if (till && grid.Till(cell)) done++;
                    if (water) grid.Water(cell, -1f);
                }
            }

            if (done > 0)
                Debug.Log("[StarterPlot2D] Đã dọn " + done + " ô đất sẵn cho người chơi mới.");
        }
    }
}
