# Icons — DREAMengin sprite sheet

## Sheet file

| Property       | Value                          |
|----------------|-------------------------------|
| Path           | `/public/images/iconslist.png` |
| Served at      | `/images/iconslist.png`        |
| Dimensions     | 1168 × 896 px                  |
| Format         | PNG (RGBA, transparent bg)     |
| Columns (COLS) | 11                             |
| Rows (ROWS)    | 9                              |
| Display size   | 96 × 96 px per cell (FRAME_W/H)|
| Total icons    | 99 (11 × 9)                    |

CSS renders the sheet scaled to `(COLS × FRAME_W) × (ROWS × FRAME_H)` = **1056 × 864 px**, so every cell is an exact 96 × 96 square.

---

## Grid reference

Row indices are 0-based top-to-bottom; column indices are 0-based left-to-right.

| Row | Col 0        | Col 1       | Col 2       | Col 3       | Col 4         | Col 5        | Col 6       | Col 7       | Col 8       | Col 9       | Col 10         |
|-----|-------------|-------------|-------------|-------------|--------------|-------------|-------------|-------------|-------------|-------------|----------------|
| 0   | facebook    | twitter     | instagram   | linkedin    | youtube      | tiktok      | messenger   | pinterest   | douyin      | whatsapp    | airpods        |
| 1   | tiktok2     | bigo        | snapchat    | reddit      | discord      | apple-music | spotify     | music       | soundcloud  | twitch      | vimeo          |
| 2   | vimeo2      | dropbox     | behance     | nba         | medium       | basketball  | vimeo3      | dribbble    | behance2    | —           | figma          |
| 3   | calendar    | cart        | maps        | video       | people       | globe       | windows     | safari      | firefox     | —           | —              |
| 4   | apple       | android     | amazon      | paypal      | —            | ebay        | shopify     | mastercard  | —           | visa        | venmo          |
| 5   | netflix     | hulu        | hoopla      | disney-plus | prime-video  | —           | youtube-music| skype      | —           | —           | nintendo-switch|
| 6   | xbox        | —           | ps5         | steam       | —            | epic-games  | controller  | nintendo    | settings    | wallet      | lock           |
| 7   | star        | mail        | phone       | chat        | wifi         | —           | camera      | heart       | bell        | —           | microphone     |
| 8   | check / dot | close       | eye         | folder      | upload       | document    | list        | edit        | more        | trash       | settings2      |

`—` = cell exists in the sheet but is not mapped (duplicate or unlabelled).

---

## Adding a new icon

1. Identify the icon's **col** and **row** in the grid above.
2. Add a new entry to `ICONS` in `lib/icons/sheet.ts`:
   ```ts
   myicon: { col: 3, row: 7 },
   ```
3. Add `'myicon'` to the `IconName` union in the same file.
4. Update this document's grid reference.

---

## Usage

```tsx
import SheetIcon from '@/components/ui/SheetIcon';

// decorative
<SheetIcon name="spotify" size={48} />

// meaningful
<SheetIcon name="mail" size={32} ariaLabel="Email" />
```

```tsx
import IconList from '@/components/ui/IconList';

<IconList items={[
  { icon: 'mail',  label: 'Contact Support', href: '/support/contact' },
  { icon: 'chat',  label: 'Community Forum', href: '/community' },
]} />
```
