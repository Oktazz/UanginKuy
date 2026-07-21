# UanginKuy Design System

## 1. Design Principles
- **Eco-first** → warna hijau dominan (trust + sustainability)
- **Clean & modern** → minimal clutter
- **Mobile-first** → karena kurir & user pakai HP
- **Data-friendly UI** → banyak dashboard & informasi

## 2. Color System

### Base Palette (dari gambar)
| Token | Hex | Usage |
|---|---|---|
| Primary | `#306D29` | Main action, button, branding |
| Primary Dark | `#0D530E` | Hover, active state |
| Secondary | `#E7E1B1` | Highlight, card accent |
| Background | `#FBF5DD` | Main background |
| Surface | `#FFFFFF` | Card, modal |

### Extended Colors (Rekomendasi)
Tambahan agar UI lebih fleksibel:

| Token | Hex | Usage |
|---|---|---|
| Success | `#22C55E` | Status berhasil |
| Warning | `#F59E0B` | Alert ringan |
| Error | `#EF4444` | Error |
| Info | `#3B82F6` | Informasi |

### Text Colors
| Token | Hex | Usage |
|---|---|---|
| Text Primary | `#1F2937` | Heading |
| Text Secondary | `#4B5563` | Body |
| Text Muted | `#9CA3AF` | Caption |
| Text On Primary | `#FFFFFF` | Button |

### Neutral Scale
| Token | Hex |
|---|---|
| Gray 50 | `#F9FAFB` |
| Gray 100 | `#F3F4F6` |
| Gray 200 | `#E5E7EB` |
| Gray 300 | `#D1D5DB` |

## 3. Typography

### Font Family
Gunakan:
- **Primary:** Inter (modern, clean, readable)
- **Fallback:** system-ui, sans-serif

### Type Scale
| Level | Size | Weight | Usage |
|---|---|---|---|
| H1 | 32px | 700 | Page title |
| H2 | 24px | 600 | Section |
| H3 | 20px | 600 | Subsection |
| Body Large | 16px | 400 | Main text |
| Body | 14px | 400 | Default |
| Caption | 12px | 400 | Info kecil |

### Style Rules
- Line height: 1.5
- Letter spacing:
  - Heading: -0.02em
  - Body: normal
- Jangan pakai terlalu banyak font weight

## 4. Spacing System

Gunakan sistem 8pt grid:

| Token | Value |
|---|---|
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 32px |
| 2xl | 48px |

### Layout Rules
- Padding card: 16px
- Section spacing: 32px
- Gap antar komponen: 16px

## 5. Border Radius
| Token | Value | Usage |
|---|---|---|
| sm | 6px | input |
| md | 10px | card |
| lg | 16px | modal |
| xl | 24px | special UI |

## 6. Component Design Rules

### Button
- Height: 44px
- Radius: 10px
- Padding: 0 16px
- **Variants:**
  - Primary → hijau
  - Secondary → outline
  - Ghost → transparan

### Card
- Background: white
- Radius: 10px
- Shadow: soft
- `box-shadow: 0 4px 12px rgba(0,0,0,0.05);`

### Input
- Height: 40px
- Border: 1px solid gray-300
- Focus: primary color

## 7. Dark Mode (Optional tapi bagus untuk lomba)
| Token | Light | Dark |
|---|---|---|
| Background | `#FBF5DD` | `#0F172A` |
| Surface | `#FFFFFF` | `#1E293B` |
| Text | `#1F2937` | `#F9FAFB` |

## 8. Responsive Breakpoints
| Device | Width |
|---|---|
| Mobile | < 640px |
| Tablet | 640px |
| Laptop | 1024px |
| Desktop | 1280px |

## 9. UX Guidelines (PENTING BUAT LOMBA)
- Jangan lebih dari 3 warna utama dalam 1 screen
- Gunakan ikon (lucide / heroicons)
- Feedback harus jelas:
  - loading
  - success
  - error
- Semua action harus ada state:
  - hover
  - active
  - disabled

## 10. Tailwind Config (Langsung Pakai)
```javascript
theme: {
  extend: {
    colors: {
      primary: "#306D29",
      "primary-dark": "#0D530E",
      secondary: "#E7E1B1",
      background: "#FBF5DD",
      surface: "#FFFFFF",
      success: "#22C55E",
      warning: "#F59E0B",
      error: "#EF4444",
      info: "#3B82F6",
    },
    borderRadius: {
      sm: "6px",
      md: "10px",
      lg: "16px",
      xl: "24px",
    },
    spacing: {
      xs: "4px",
      sm: "8px",
      md: "16px",
      lg: "24px",
      xl: "32px",
      "2xl": "48px",
    }
  }
}
```
