export interface VrpPoint {
  id: string;
  latitude: number;
  longitude: number;
  courier_id?: string | null;
}

// Titik Awal (Depot / Gudang UanginKuy) kini dipindahkan ke database (app_settings)
// dan di-fetch secara dinamis saat eksekusi.

/**
 * Menghitung jarak garis lurus (jarak udara) menggunakan rumus Haversine.
 * Mengembalikan hasil dalam satuan Kilometer (km).
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Jari-jari bumi dalam km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Mengelompokkan titik (clustering) berdasarkan kedekatan wilayah geografis
 * menggunakan algoritma K-Means dengan inisialisasi K-Means++ (Farthest-First Traversal).
 * Menghasilkan pemetaan courierId -> points.
 */
export function kMeansClustering(
  points: VrpPoint[],
  courierIds: string[],
  depot: VrpPoint
): Record<string, VrpPoint[]> {
  const k = courierIds.length;
  const result: Record<string, VrpPoint[]> = {};
  for (const cid of courierIds) {
    result[cid] = [];
  }

  if (k === 0 || points.length === 0) return result;

  // Jika hanya 1 kurir, serahkan semua titik kepadanya
  if (k === 1) {
    result[courierIds[0]] = [...points];
    return result;
  }

  // Jumlah klaster efektif tidak boleh melebihi jumlah titik
  const effectiveK = Math.min(k, points.length);

  // Inisialisasi centroid menggunakan K-Means++ (Farthest-First Traversal)
  const centroids: { lat: number; lon: number }[] = [];

  // Centroid pertama: titik yang terjauh dari depot
  let firstIdx = 0;
  let maxDepotDist = -1;
  for (let i = 0; i < points.length; i++) {
    const d = haversineDistance(
      points[i].latitude,
      points[i].longitude,
      depot.latitude,
      depot.longitude
    );
    if (d > maxDepotDist) {
      maxDepotDist = d;
      firstIdx = i;
    }
  }
  centroids.push({
    lat: points[firstIdx].latitude,
    lon: points[firstIdx].longitude,
  });

  // Centroid berikutnya: cari titik yang memiliki jarak terjauh terhadap centroid yang sudah ada
  while (centroids.length < effectiveK) {
    let farthestIdx = 0;
    let maxDistToCentroids = -1;

    for (let i = 0; i < points.length; i++) {
      let minDistToCentroid = Infinity;
      for (const c of centroids) {
        const d = haversineDistance(
          points[i].latitude,
          points[i].longitude,
          c.lat,
          c.lon
        );
        if (d < minDistToCentroid) {
          minDistToCentroid = d;
        }
      }
      if (minDistToCentroid > maxDistToCentroids) {
        maxDistToCentroids = minDistToCentroid;
        farthestIdx = i;
      }
    }
    centroids.push({
      lat: points[farthestIdx].latitude,
      lon: points[farthestIdx].longitude,
    });
  }

  // Jika jumlah kurir lebih banyak dari titik, pad sisa centroid dengan depot
  while (centroids.length < k) {
    centroids.push({ lat: depot.latitude, lon: depot.longitude });
  }

  const MAX_ITERATIONS = 50;
  let clusters: number[] = new Array(points.length).fill(0);
  let hasChanged = true;
  let iterations = 0;

  while (hasChanged && iterations < MAX_ITERATIONS) {
    hasChanged = false;
    iterations++;

    // a. Assign titik ke centroid terdekat (hanya di antara effectiveK centroid aktif)
    for (let i = 0; i < points.length; i++) {
      let minDistance = Infinity;
      let clusterIndex = 0;

      for (let j = 0; j < effectiveK; j++) {
        const d = haversineDistance(
          points[i].latitude,
          points[i].longitude,
          centroids[j].lat,
          centroids[j].lon
        );
        if (d < minDistance) {
          minDistance = d;
          clusterIndex = j;
        }
      }

      if (clusters[i] !== clusterIndex) {
        clusters[i] = clusterIndex;
        hasChanged = true;
      }
    }

    // b. Hitung ulang pusat (centroid) setiap klaster
    const newCentroids = Array.from({ length: effectiveK }, () => ({
      sumLat: 0,
      sumLon: 0,
      count: 0,
    }));
    for (let i = 0; i < points.length; i++) {
      const c = clusters[i];
      newCentroids[c].sumLat += points[i].latitude;
      newCentroids[c].sumLon += points[i].longitude;
      newCentroids[c].count++;
    }

    for (let j = 0; j < effectiveK; j++) {
      if (newCentroids[j].count > 0) {
        centroids[j] = {
          lat: newCentroids[j].sumLat / newCentroids[j].count,
          lon: newCentroids[j].sumLon / newCentroids[j].count,
        };
      }
    }
  }

  // Pasangkan cluster ke ID kurir yang sebenarnya
  for (let i = 0; i < points.length; i++) {
    const courierId = courierIds[clusters[i]];
    result[courierId].push(points[i]);
  }

  return result;
}

/**
 * Mencari urutan rute terpendek dalam sebuah himpunan titik.
 * Menggunakan pendekatan Nearest Neighbor yang dimulai DARI TITIK DEPOT.
 */
export function solveTSPNearestNeighbor(depot: VrpPoint, points: VrpPoint[]): VrpPoint[] {
  if (points.length === 0) return [];
  
  const unvisited = [...points];
  const route: VrpPoint[] = [];
  let current = depot;

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const p = unvisited[i];
      const d = haversineDistance(current.latitude, current.longitude, p.latitude, p.longitude);
      
      if (d < minDistance) {
        minDistance = d;
        nearestIdx = i;
      }
    }

    // Pindah ke titik paling dekat, masukkan ke rute, hapus dari daftar belum dikunjungi
    const nextNode = unvisited[nearestIdx];
    route.push(nextNode);
    unvisited.splice(nearestIdx, 1);
    current = nextNode;
  }

  return route;
}
