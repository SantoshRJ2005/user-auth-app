const mumbaiNetworkData = {
  "network_name": "Mumbai Local Rail Network",
  "data_source": "Image provided by user, with corrections applied",
  "disclaimer": "This data is based on the provided image and has been corrected for known errors. Station names have been updated to their current official names (e.g., 'CSMT', 'Prabhadevi'). Distances for the Trans-Harbour and Diva-Roha lines have been calculated and may be approximate. Note that the distance to a station (e.g., Panvel) can differ between lines due to different physical routes.",
  "lines": [
    {
      "line_name": "Western",
      "routes": [
        {
          "route_name": "Churchgate - Dahanu Road",
          "stations": [
            { "station_name": "Churchgate", "distance_km": 0, "is_junction": false, "connections": [] },
            { "station_name": "Marine Lines", "distance_km": 2, "is_junction": false, "connections": [] },
            { "station_name": "Charni Road", "distance_km": 3, "is_junction": false, "connections": [] },
            { "station_name": "Grant Road", "distance_km": 4, "is_junction": false, "connections": [] },
            { "station_name": "Mumbai Central", "distance_km": 5, "is_junction": false, "connections": [] },
            { "station_name": "Mahalaxmi", "distance_km": 6, "is_junction": false, "connections": [] },
            { "station_name": "Lower Parel", "distance_km": 8, "is_junction": false, "connections": [] },
            { "station_name": "Prabhadevi", "distance_km": 9, "is_junction": false, "connections": [] },
            { "station_name": "Dadar", "distance_km": 11, "is_junction": true, "connections": ["Western", "Central"] },
            { "station_name": "Matunga Road", "distance_km": 12, "is_junction": false, "connections": [] },
            { "station_name": "Mahim Jn.", "distance_km": 13, "is_junction": true, "connections": ["Western", "Harbour"] },
            { "station_name": "Bandra", "distance_km": 17, "is_junction": true, "connections": ["Western", "Harbour"] },
            { "station_name": "Khar Road", "distance_km": 18, "is_junction": false, "connections": [] },
            { "station_name": "Santacruz", "distance_km": 20, "is_junction": false, "connections": [] },
            { "station_name": "Vile Parle", "distance_km": 22, "is_junction": false, "connections": [] },
            { "station_name": "Andheri", "distance_km": 23, "is_junction": true, "connections": ["Western", "Harbour"] },
            { "station_name": "Jogeshwari", "distance_km": 24, "is_junction": false, "connections": [] },
            { "station_name": "Goregaon", "distance_km": 27, "is_junction": false, "connections": [] },
            { "station_name": "Malad", "distance_km": 30, "is_junction": false, "connections": [] },
            { "station_name": "Kandivali", "distance_km": 32, "is_junction": false, "connections": [] },
            { "station_name": "Borivali", "distance_km": 34, "is_junction": false, "connections": [] },
            { "station_name": "Dahisar", "distance_km": 37, "is_junction": false, "connections": [] },
            { "station_name": "Mira Road", "distance_km": 40, "is_junction": false, "connections": [] },
            { "station_name": "Bhayandar", "distance_km": 44, "is_junction": false, "connections": [] },
            { "station_name": "Naigaon", "distance_km": 48, "is_junction": false, "connections": [] },
            { "station_name": "Vasai Road", "distance_km": 52, "is_junction": true, "connections": ["Western", "Central"] },
            { "station_name": "Nallasopara", "distance_km": 56, "is_junction": false, "connections": [] },
            { "station_name": "Virar", "distance_km": 60, "is_junction": false, "connections": [] },
            { "station_name": "Vaitarna", "distance_km": 69, "is_junction": false, "connections": [] },
            { "station_name": "Saphale", "distance_km": 77, "is_junction": false, "connections": [] },
            { "station_name": "Kelva Road", "distance_km": 83, "is_junction": false, "connections": [] },
            { "station_name": "Palghar", "distance_km": 91, "is_junction": false, "connections": [] },
            { "station_name": "Boisar", "distance_km": 103, "is_junction": false, "connections": [] },
            { "station_name": "Dahanu Road", "distance_km": 124, "is_junction": false, "connections": [] }
          ]
        }
      ]
    },
    {
      "line_name": "Central",
      "routes": [
        {
          "route_name": "CSMT - Kasara",
          "stations": [
            { "station_name": "Chhatrapati Shivaji Maharaj Terminus (CSMT)", "distance_km": 0, "is_junction": true, "connections": ["Central", "Harbour"] },
            { "station_name": "Masjid", "distance_km": 3, "is_junction": false, "connections": [] },
            { "station_name": "Sandhurst Road", "distance_km": 4, "is_junction": true, "connections": ["Central", "Harbour"] },
            { "station_name": "Byculla", "distance_km": 6, "is_junction": false, "connections": [] },
            { "station_name": "Chinchpokli", "distance_km": 7, "is_junction": false, "connections": [] },
            { "station_name": "Currey Road", "distance_km": 8, "is_junction": false, "connections": [] },
            { "station_name": "Parel", "distance_km": 9, "is_junction": false, "connections": [] },
            { "station_name": "Dadar", "distance_km": 11, "is_junction": true, "connections": ["Central", "Western"] },
            { "station_name": "Matunga", "distance_km": 12, "is_junction": false, "connections": [] },
            { "station_name": "Sion", "distance_km": 13, "is_junction": false, "connections": [] },
            { "station_name": "Kurla", "distance_km": 16, "is_junction": true, "connections": ["Central", "Harbour"] },
            { "station_name": "Vidyavihar", "distance_km": 18, "is_junction": false, "connections": [] },
            { "station_name": "Ghatkopar", "distance_km": 20, "is_junction": false, "connections": [] },
            { "station_name": "Vikhroli", "distance_km": 23, "is_junction": false, "connections": [] },
            { "station_name": "Kanjurmarg", "distance_km": 25, "is_junction": false, "connections": [] },
            { "station_name": "Bhandup", "distance_km": 26, "is_junction": false, "connections": [] },
            { "station_name": "Mulund", "distance_km": 31, "is_junction": false, "connections": [] },
            { "station_name": "Thane", "distance_km": 34, "is_junction": true, "connections": ["Central", "Trans-Harbour"] },
            { "station_name": "Kalva", "distance_km": 36, "is_junction": false, "connections": [] },
            { "station_name": "Mumbra", "distance_km": 40, "is_junction": false, "connections": [] },
            { "station_name": "Diva", "distance_km": 43, "is_junction": true, "connections": ["Central"] },
            { "station_name": "Kopar", "distance_km": 49, "is_junction": false, "connections": [] },
            { "station_name": "Dombivli", "distance_km": 50, "is_junction": false, "connections": [] },
            { "station_name": "Kalyan", "distance_km": 54, "is_junction": true, "connections": ["Central"] },
            { "station_name": "Shahad", "distance_km": 57, "is_junction": false, "connections": [] },
            { "station_name": "Ambivli", "distance_km": 60, "is_junction": false, "connections": [] },
            { "station_name": "Titwala", "distance_km": 65, "is_junction": false, "connections": [] },
            { "station_name": "Khadavli", "distance_km": 75, "is_junction": false, "connections": [] },
            { "station_name": "Vasind", "distance_km": 80, "is_junction": false, "connections": [] },
            { "station_name": "Asangaon", "distance_km": 86, "is_junction": false, "connections": [] },
            { "station_name": "Atgaon", "distance_km": 95, "is_junction": false, "connections": [] },
            { "station_name": "Khardi", "distance_km": 100, "is_junction": false, "connections": [] },
            { "station_name": "Kasara", "distance_km": 121, "is_junction": false, "connections": [] }
          ]
        },
        {
          "route_name": "CSMT - Khopoli",
          "stations": [
            { "station_name": "Chhatrapati Shivaji Maharaj Terminus (CSMT)", "distance_km": 0, "is_junction": true, "connections": ["Central", "Harbour"] },
            { "station_name": "Masjid", "distance_km": 3, "is_junction": false, "connections": [] },
            { "station_name": "Sandhurst Road", "distance_km": 4, "is_junction": true, "connections": ["Central", "Harbour"] },
            { "station_name": "Byculla", "distance_km": 6, "is_junction": false, "connections": [] },
            { "station_name": "Chinchpokli", "distance_km": 7, "is_junction": false, "connections": [] },
            { "station_name": "Currey Road", "distance_km": 8, "is_junction": false, "connections": [] },
            { "station_name": "Parel", "distance_km": 9, "is_junction": false, "connections": [] },
            { "station_name": "Dadar", "distance_km": 11, "is_junction": true, "connections": ["Central", "Western"] },
            { "station_name": "Matunga", "distance_km": 12, "is_junction": false, "connections": [] },
            { "station_name": "Sion", "distance_km": 13, "is_junction": false, "connections": [] },
            { "station_name": "Kurla", "distance_km": 16, "is_junction": true, "connections": ["Central", "Harbour"] },
            { "station_name": "Vidyavihar", "distance_km": 18, "is_junction": false, "connections": [] },
            { "station_name": "Ghatkopar", "distance_km": 20, "is_junction": false, "connections": [] },
            { "station_name": "Vikhroli", "distance_km": 23, "is_junction": false, "connections": [] },
            { "station_name": "Kanjurmarg", "distance_km": 25, "is_junction": false, "connections": [] },
            { "station_name": "Bhandup", "distance_km": 26, "is_junction": false, "connections": [] },
            { "station_name": "Mulund", "distance_km": 31, "is_junction": false, "connections": [] },
            { "station_name": "Thane", "distance_km": 34, "is_junction": true, "connections": ["Central", "Trans-Harbour"] },
            { "station_name": "Kalva", "distance_km": 36, "is_junction": false, "connections": [] },
            { "station_name": "Mumbra", "distance_km": 40, "is_junction": false, "connections": [] },
            { "station_name": "Diva", "distance_km": 43, "is_junction": true, "connections": ["Central"] },
            { "station_name": "Kopar", "distance_km": 49, "is_junction": false, "connections": [] },
            { "station_name": "Dombivli", "distance_km": 50, "is_junction": false, "connections": [] },
            { "station_name": "Kalyan", "distance_km": 54, "is_junction": true, "connections": ["Central"] },
            { "station_name": "Vithalwadi", "distance_km": 57, "is_junction": false, "connections": [] },
            { "station_name": "Ulhasnagar", "distance_km": 58, "is_junction": false, "connections": [] },
            { "station_name": "Ambernath", "distance_km": 60, "is_junction": false, "connections": [] },
            { "station_name": "Badlapur", "distance_km": 68, "is_junction": false, "connections": [] },
            { "station_name": "Vangani", "distance_km": 78, "is_junction": false, "connections": [] },
            { "station_name": "Shelu", "distance_km": 83, "is_junction": false, "connections": [] },
            { "station_name": "Neral", "distance_km": 87, "is_junction": false, "connections": [] },
            { "station_name": "Bhivpuri Road", "distance_km": 93, "is_junction": false, "connections": [] },
            { "station_name": "Karjat", "distance_km": 100, "is_junction": true, "connections": ["Central"] },
            { "station_name": "Palasdari", "distance_km": 102, "is_junction": false, "connections": [] },
            { "station_name": "Kelavali", "distance_km": 108, "is_junction": false, "connections": [] },
            { "station_name": "Dolavali", "distance_km": 109, "is_junction": false, "connections": [] },
            { "station_name": "Lowjee", "distance_km": 112, "is_junction": false, "connections": [] },
            { "station_name": "Khopoli", "distance_km": 115, "is_junction": false, "connections": [] }
          ]
        },
        {
          "route_name": "Diva - Roha",
          "stations": [
            { "station_name": "Diva", "distance_km": 43, "is_junction": true, "connections": ["Central"] },
            { "station_name": "Dativali", "distance_km": 46, "is_junction": false, "connections": [] },
            { "station_name": "Nilaje", "distance_km": 49, "is_junction": false, "connections": [] },
            { "station_name": "Taloje", "distance_km": 55, "is_junction": false, "connections": [] },
            { "station_name": "Navade Road", "distance_km": 58, "is_junction": false, "connections": [] },
            { "station_name": "Kalamboli", "distance_km": 61, "is_junction": false, "connections": [] },
            { "station_name": "Panvel", "distance_km": 64, "is_junction": true, "connections": ["Harbour", "Trans-Harbour", "Central"] },
            { "station_name": "Apta", "distance_km": 71, "is_junction": false, "connections": [] },
            { "station_name": "Rasayani", "distance_km": 77, "is_junction": false, "connections": [] },
            { "station_name": "Hamrapur", "distance_km": 85, "is_junction": false, "connections": [] },
            { "station_name": "Pen", "distance_km": 94, "is_junction": false, "connections": [] },
            { "station_name": "Khasu", "distance_km": 100, "is_junction": false, "connections": [] },
            { "station_name": "Nagothane", "distance_km": 108, "is_junction": false, "connections": [] },
            { "station_name": "Roha", "distance_km": 119, "is_junction": false, "connections": [] }
          ]
        }
      ]
    },
    {
      "line_name": "Harbour",
      "routes": [
        {
          "route_name": "CSMT - Panvel",
          "stations": [
            { "station_name": "Chhatrapati Shivaji Maharaj Terminus (CSMT)", "distance_km": 0, "is_junction": true, "connections": ["Central", "Harbour"] },
            { "station_name": "Masjid", "distance_km": 3, "is_junction": false, "connections": [] },
            { "station_name": "Sandhurst Road", "distance_km": 4, "is_junction": true, "connections": ["Central", "Harbour"] },
            { "station_name": "Dockyard Road", "distance_km": 4, "is_junction": false, "connections": [] },
            { "station_name": "Reay Road", "distance_km": 5, "is_junction": false, "connections": [] },
            { "station_name": "Cotton Green", "distance_km": 6, "is_junction": false, "connections": [] },
            { "station_name": "Sewri", "distance_km": 8, "is_junction": false, "connections": [] },
            { "station_name": "Wadala Road", "distance_km": 10, "is_junction": true, "connections": ["Harbour"] },
            { "station_name": "Chunabhatti", "distance_km": 14, "is_junction": false, "connections": [] },
            { "station_name": "Kurla", "distance_km": 16, "is_junction": true, "connections": ["Harbour", "Central"] },
            { "station_name": "Tilak Nagar", "distance_km": 17, "is_junction": false, "connections": [] },
            { "station_name": "Chembur", "distance_km": 18, "is_junction": false, "connections": [] },
            { "station_name": "Govandi", "distance_km": 19, "is_junction": false, "connections": [] },
            { "station_name": "Mankhurd", "distance_km": 22, "is_junction": false, "connections": [] },
            { "station_name": "Vashi", "distance_km": 29, "is_junction": true, "connections": ["Harbour", "Trans-Harbour"] },
            { "station_name": "Sanpada", "distance_km": 31, "is_junction": true, "connections": ["Harbour", "Trans-Harbour"] },
            { "station_name": "Juinagar", "distance_km": 32, "is_junction": false, "connections": [] },
            { "station_name": "Nerul", "distance_km": 35, "is_junction": true, "connections": ["Harbour", "Trans-Harbour"] },
            { "station_name": "Seawood", "distance_km": 37, "is_junction": false, "connections": [] },
            { "station_name": "Belapur", "distance_km": 39, "is_junction": false, "connections": [] },
            { "station_name": "Kharghar", "distance_km": 41, "is_junction": false, "connections": [] },
            { "station_name": "Khandeshwar", "distance_km": 46, "is_junction": false, "connections": [] },
            { "station_name": "Panvel", "distance_km": 49, "is_junction": true, "connections": ["Harbour", "Trans-Harbour", "Central"] }
          ]
        },
        {
          "route_name": "CSMT - Andheri",
          "stations": [
            { "station_name": "Chhatrapati Shivaji Maharaj Terminus (CSMT)", "distance_km": 0, "is_junction": true, "connections": ["Central", "Harbour"] },
            { "station_name": "Masjid", "distance_km": 3, "is_junction": false, "connections": [] },
            { "station_name": "Sandhurst Road", "distance_km": 4, "is_junction": true, "connections": ["Central", "Harbour"] },
            { "station_name": "Dockyard Road", "distance_km": 4, "is_junction": false, "connections": [] },
            { "station_name": "Reay Road", "distance_km": 5, "is_junction": false, "connections": [] },
            { "station_name": "Cotton Green", "distance_km": 6, "is_junction": false, "connections": [] },
            { "station_name": "Sewri", "distance_km": 8, "is_junction": false, "connections": [] },
            { "station_name": "Wadala Road", "distance_km": 10, "is_junction": true, "connections": ["Harbour"] },
            { "station_name": "Kings Circle", "distance_km": 11, "is_junction": false, "connections": [] },
            { "station_name": "Mahim Jn.", "distance_km": 13, "is_junction": true, "connections": ["Harbour", "Western"] },
            { "station_name": "Bandra", "distance_km": 17, "is_junction": true, "connections": ["Harbour", "Western"] },
            { "station_name": "Khar Road", "distance_km": 18, "is_junction": false, "connections": [] },
            { "station_name": "Santacruz", "distance_km": 20, "is_junction": false, "connections": [] },
            { "station_name": "Vile Parle", "distance_km": 22, "is_junction": false, "connections": [] },
            { "station_name": "Andheri", "distance_km": 23, "is_junction": true, "connections": ["Harbour", "Western"] }
          ]
        }
      ]
    },
    {
      "line_name": "Trans-Harbour",
      "routes": [
        {
          "route_name": "Thane - Panvel",
          "stations": [
            { "station_name": "Thane", "distance_km": 34, "is_junction": true, "connections": ["Trans-Harbour", "Central"] },
            { "station_name": "Airoli", "distance_km": 38, "is_junction": false, "connections": [] },
            { "station_name": "Rabale", "distance_km": 40, "is_junction": false, "connections": [] },
            { "station_name": "Ghansoli", "distance_km": 42, "is_junction": false, "connections": [] },
            { "station_name": "Koparkhairane", "distance_km": 44, "is_junction": false, "connections": [] },
            { "station_name": "Turbhe", "distance_km": 46, "is_junction": false, "connections": [] },
            { "station_name": "Juinagar", "distance_km": 48, "is_junction": false, "connections": [] },
            { "station_name": "Nerul", "distance_km": 50, "is_junction": true, "connections": ["Trans-Harbour", "Harbour"] },
            { "station_name": "Seawood", "distance_km": 52, "is_junction": false, "connections": [] },
            { "station_name": "Belapur", "distance_km": 54, "is_junction": false, "connections": [] },
            { "station_name": "Kharghar", "distance_km": 56, "is_junction": false, "connections": [] },
            { "station_name": "Khandeshwar", "distance_km": 59, "is_junction": false, "connections": [] },
            { "station_name": "Panvel", "distance_km": 62, "is_junction": true, "connections": ["Trans-Harbour", "Harbour", "Central"] }
          ]
        }
      ]
    }
  ]
};

module.exports = mumbaiNetworkData;