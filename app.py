# app.py
from flask import Flask, render_template, request, jsonify
import heapq

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

def dijkstra(grid, start, end, rows, cols, allow_diagonal=False):
    # grid: 2D list, 0 = free, 1 = wall
    # start/end: (r, c)
    INF = 10**9
    dist = [[INF]*cols for _ in range(rows)]
    prev = [[None]*cols for _ in range(rows)]
    visited_order = []

    sr, sc = start
    er, ec = end
    if grid[sr][sc] == 1 or grid[er][ec] == 1:
        return {"visited": [], "path": []}  # no path if start/end is wall

    dist[sr][sc] = 0
    heap = [(0, sr, sc)]
    directions = [(1,0),(-1,0),(0,1),(0,-1)]
    if allow_diagonal:
        directions += [(1,1),(1,-1),(-1,1),(-1,-1)]

    while heap:
        d, r, c = heapq.heappop(heap)
        if d != dist[r][c]:
            continue
        visited_order.append([r, c])
        if (r, c) == (er, ec):
            break
        for dr, dc in directions:
            nr, nc = r+dr, c+dc
            if 0 <= nr < rows and 0 <= nc < cols:
                if grid[nr][nc] == 1:
                    continue
                nd = d + 1  # uniform cost
                if nd < dist[nr][nc]:
                    dist[nr][nc] = nd
                    prev[nr][nc] = (r, c)
                    heapq.heappush(heap, (nd, nr, nc))

    # reconstruct path
    path = []
    cur = (er, ec)
    if dist[er][ec] < INF:
        while cur:
            path.append([cur[0], cur[1]])
            cur = prev[cur[0]][cur[1]]
        path.reverse()

    return {"visited": visited_order, "path": path}

@app.route('/api/find_path', methods=['POST'])
def find_path():
    data = request.get_json()
    grid = data.get('grid')
    start = tuple(data.get('start'))
    end = tuple(data.get('end'))
    rows = data.get('rows')
    cols = data.get('cols')
    speed = data.get('speed', 50)  # unused by backend but accepted
    diagonal = data.get('diagonal', False)

    result = dijkstra(grid, start, end, rows, cols, allow_diagonal=diagonal)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
