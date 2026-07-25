/**
 * Loads the data index (default _data/index.json) with XHR progress tracking.
 */
export function loadData(onProgress, dataPath) {
  const path = dataPath || "index.json";
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", path, true);
    xhr.responseType = "arraybuffer";

    xhr.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(e.loaded, e.total);
      }
    };

    xhr.onload = () => {
      try {
        const decoder = new TextDecoder("utf-8");
        const data = JSON.parse(decoder.decode(xhr.response));
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };

    xhr.onerror = () => reject(new Error("Failed to load " + path));
    xhr.send();
  });
}

export function filterByType(nodes, type) {
  return type === "all" ? nodes : nodes.filter((n) => n.t === type);
}

export function filterByEra(node, eras) {
  if (!node.m || !eras) return false;
  const fields = ["point_in_time", "start_time", "birth_date", "death_date"];
  for (const field of fields) {
    const val = node.m[field];
    if (val) {
      const match = String(val).match(/(-?\d{4})/);
      if (match) {
        const year = parseInt(match[1], 10);
        for (const era of Object.values(eras)) {
          if (year >= era[0] && year <= era[1]) return true;
        }
      }
    }
  }
  return false;
}

export function getStats(nodes) {
  const counts = {};
  nodes.forEach((n) => {
    const key = n.t || "other";
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}
