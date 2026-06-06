# Expert Ground-Truth Rating

เว็บแอปสำหรับให้ผู้เชี่ยวชาญประเมินความเหมาะสมของนักศึกษาต่อประกาศรับสมัครงาน โดยให้คะแนน 1-5 พร้อมเหตุผลสั้น ๆ

## ข้อมูลที่ใช้

- `posting_BLIND_for_experts.csv` ประกาศงาน 4 ใบ แสดงเป็น `A1-A4`
- `roster_BLIND_for_experts.csv` transcript นักศึกษา แบ่งด้วย `Candidate_Code`

รอบการประเมิน:

- ชุดที่ 1: `A1-A4` กับ `C01-C15`
- ชุดที่ 2: `A1-A4` กับ `C16-C30`
- ชุดที่ 3: `A1-A4` กับ `C31-C45`

## วิธีใช้งานสำหรับผู้ประเมิน

1. กรอกรหัสผู้ประเมิน
2. เลือกรอบการประเมิน
3. เลือกประกาศงาน `A1-A4`
4. อ่านทักษะที่ต้องการ คำบรรยายงาน และ Student Profile
5. ให้คะแนนนักศึกษาแต่ละคน `1-5`
6. ใส่เหตุผลสั้น ๆ ในช่องเหตุผล

คะแนนซ้ำกันได้ เพราะเป็นการประเมินความเหมาะสมรายคน ไม่ใช่การจัดอันดับ

## Admin

กดปุ่ม `Admin` เพื่อเปิดส่วนตั้งค่าและส่งออกผล

- user: `adminA`
- password: `1432`

Admin สามารถ:

- ตั้งค่า Google Sheets Web App URL
- ดาวน์โหลดผลเป็น `CSV` หรือ `JSON`

## บันทึกผลลง Google Sheets

1. สร้าง Google Sheet เปล่า
2. ไปที่ `Extensions` > `Apps Script`
3. วางโค้ดจากไฟล์ `google_apps_script.gs`
4. กด `Deploy` > `New deployment`
5. เลือกชนิดเป็น `Web app`
6. ตั้งค่า:
   - Execute as: `Me`
   - Who has access: `Anyone`
7. กด `Deploy` แล้วคัดลอก Web App URL ที่ลงท้ายด้วย `/exec`
8. กลับมาที่เว็บ กด `Admin`
9. วาง URL ในช่อง `Google Sheets Web App URL` แล้วกด `บันทึก URL`
10. ผู้ประเมินกด `บันทึกลง Google Sheets` เพื่อส่งคะแนน

คะแนนจะถูกบันทึกลง sheet ชื่อ `Expert Ratings`

หมายเหตุ: เว็บมี local autosave ใน browser เพื่อกันข้อมูลหายจากการ refresh แต่การรวมผลหลายคนควรใช้ปุ่มบันทึกลง Google Sheets

## เปิดใช้งานในเครื่อง

```bash
python3 -m http.server 4173
```

แล้วเปิด:

```text
http://localhost:4173/
```
