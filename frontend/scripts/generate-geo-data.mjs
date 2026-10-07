import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicGeoDir = path.resolve(__dirname, "../public/geo-data");

if (!fs.existsSync(publicGeoDir)) {
  fs.mkdirSync(publicGeoDir, { recursive: true });
}

const geoDataset = {
  "west-bengal": {
    state: "West Bengal",
    districts: {
      "Bankura": {
        blocks: {
          "Joypur Block": [
            "Rampur Village",
            "Belur Village",
            "Gopalpur Forest Ward",
            "Abhirampur",
            "Mayurjharna",
            "Kankradhara",
            "Joypur Bazar",
            "Rajnagar",
            "Salboni",
            "Kharbona",
            "Shyamsundarpur",
            "Baidyanathpur",
            "Hakimpara",
            "Tentulia Hamlet",
            "Dharampur Ward 1",
            "Dharampur Ward 2"
          ],
          "Sonamukhi Block": [
            "Sonamukhi East",
            "Sonamukhi West",
            "Dhansimla",
            "Radhamohanpur",
            "Hamirhati",
            "Panchal",
            "Kalyanpur",
            "Chhototaraf",
            "Bara Taraf",
            "Madanmohanpur",
            "Kusumgram"
          ],
          "Kotulpur Block": [
            "Kotulpur Rural",
            "Shyampur Ward 2",
            "Laugram",
            "Mirzapur",
            "Deshrah",
            "Sihar",
            "Gopinathpur",
            "Madhabpur",
            "Bansgara",
            "Koalpara"
          ],
          "Bishnupur Block": [
            "Bishnupur Ward 4",
            "Dharapat",
            "Bikna",
            "Ayodhya",
            "Uliyara",
            "Bankadaha",
            "Layekpara",
            "Morar",
            "Belsulia"
          ]
        }
      },
      "Purulia": {
        blocks: {
          "Purulia I": [
            "Bhatbundh",
            "Baraurma",
            "Chharra",
            "Sonai",
            "Lagda",
            "Dimdiha"
          ],
          "Purulia II": [
            "Agoya-Narra",
            "Bhangra",
            "Chhutam",
            "Golamara",
            "Kenda"
          ],
          "Jhalda": [
            "Jhalda East",
            "Maramosor",
            "Kora",
            "Tulin",
            "Begunkodor"
          ]
        }
      },
      "Paschim Medinipur": {
        blocks: {
          "Garhbeta": [
            "Garhbeta Rural",
            "Amlagora",
            "Sandhipur",
            "Ukhla",
            "Manglapota"
          ],
          "Salboni": [
            "Salboni Central",
            "Bhimpur",
            "Bankibandh",
            "Debgram"
          ]
        }
      },
      "Birbhum": {
        blocks: {
          "Bolpur Sriniketan": [
            "Sian",
            "Ruppur",
            "Kasba",
            "Sattor",
            "Bahiri"
          ],
          "Suri I": [
            "Alundi",
            "Karidhya",
            "Khatanga",
            "Mallickpur"
          ]
        }
      },
      "Hooghly": {
        blocks: {
          "Arambagh": [
            "Arambagh Rural",
            "Arandi",
            "Batur",
            "Gora",
            "Harinkhola"
          ],
          "Tarakeswar": [
            "Tarakeswar Rural",
            "Bhanjipur",
            "Champadanga",
            "Keshabpur"
          ]
        }
      }
    }
  },
  "bihar": {
    state: "Bihar",
    districts: {
      "Patna": {
        blocks: {
          "Patna Sadar": ["Digha", "Kankarbagh", "Danapur", "Phulwari"],
          "Barh": ["Bakhtiarpur", "Athmalgola", "Mokama Rural", "Ghoswari"]
        }
      },
      "Gaya": {
        blocks: {
          "Bodh Gaya": ["Mastipur", "Tikus", "Bakrour", "Mocharim"],
          "Sherghati": ["Hamzapur", "Chitakhap", "Mahamadpur"]
        }
      },
      "Muzaffarpur": {
        blocks: {
          "Mushahari": ["Bara Jagannath", "Rohua", "Prahladpur"],
          "Kanti": ["Kanti Rural", "Damodarpur", "Madanpur"]
        }
      }
    }
  },
  "jharkhand": {
    state: "Jharkhand",
    districts: {
      "Ranchi": {
        blocks: {
          "Kanke": ["Sukhurhutu", "Boreya", "Arsande", "Pithoria"],
          "Namkum": ["Lalpur Rural", "Tati", "Rajaulatu", "Sidroll"]
        }
      },
      "East Singhbhum": {
        blocks: {
          "Ghatshila": ["Dharambahal", "Kasida", "Gopalpur", "Galudih"],
          "Potka": ["Haldipokhar", "Sanram", "Kowali"]
        }
      }
    }
  },
  "odisha": {
    state: "Odisha",
    districts: {
      "Mayurbhanj": {
        blocks: {
          "Baripada": ["Poda Astia", "Manatri", "Kuchei", "Badsole"],
          "Rairangpur": ["Gorumahisani", "Suleipat", "Bisoi", "Bahalda"]
        }
      },
      "Balasore": {
        blocks: {
          "Remuna": ["Mandarpur", "Bada Khuruda", "Kalyani", "Nuasahi"],
          "Jaleswar": ["Raibania", "Laxmannath", "Sugalo"]
        }
      }
    }
  },
  "assam": {
    state: "Assam",
    districts: {
      "Kamrup": {
        blocks: {
          "Hajo": ["Ramdia", "Dadara", "Singra", "Sualkuchi"],
          "Rangia": ["Murara", "Bhatkuchi", "Tarani"]
        }
      },
      "Cachar": {
        blocks: {
          "Silchar": ["Dudpatil", "Meherpur", "Kanakpur", "Rongpur"],
          "Lakhipur": ["Binnakandi", "Chiripool", "Jirighat"]
        }
      }
    }
  }
};

// Write state JSON files
const index = [];

for (const [slug, data] of Object.entries(geoDataset)) {
  const filePath = path.join(publicGeoDir, `${slug}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  index.push({ name: data.state, slug });
  console.log(`Generated: ${filePath}`);
}

// Write index.json
const indexPath = path.join(publicGeoDir, "index.json");
fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), "utf-8");
console.log(`Generated: ${indexPath}`);
console.log("Geo-data precomputation complete!");
