import mongoose, { Schema } from 'mongoose';
import path from 'path';
import * as dotenv from 'dotenv';

// 1. โหลด Environment Variables
// เช็คให้ชัวร์ว่า .env.local อยู่ที่ root folder (ถอยจาก src/lib ไป 2 ชั้น)
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(`Please define the MONGODB_URI environment variable inside .env.local`);
}

// --- 2. ประกาศ Schema ในนี้เลย (แก้ปัญหา ts-node อ่าน @ ไม่เจอ) ---
const ChecklistSchema = new Schema(
  { text: { type: String }, done: { type: Boolean, default: false } },
  { _id: false }
);

const AttachmentSchema = new Schema(
  {
    url: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CommentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const TimeTrackingSchema = new Schema(
  {
    estimated: { type: Number, default: 0 },
    logged: { type: Number, default: 0 },
  },
  { _id: false }
);

const TasksSchema = new Schema(
  {
    columnId: { type: Schema.Types.ObjectId, ref: "Column", required: true },
    title: { type: String, required: true },
    description: { type: String },
    assignees: [{ type: Schema.Types.ObjectId, ref: "User" }],
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    dueDate: { type: Date },
    tags: [{ type: String, default: [] }],
    order: { type: Number, required: true, default: 1 },
    archived: { type: Boolean, default: false },
    checklist: { type: [ChecklistSchema], default: [] },
    attachments: { type: [AttachmentSchema], default: [] },
    comments: { type: [CommentSchema], default: [] },
    timeTracking: { type: TimeTrackingSchema, default: {} },
    dependencies: [{ type: Schema.Types.ObjectId, ref: "Task" }],
  },
  { timestamps: true }
);

// สร้าง Model เฉพาะกิจสำหรับ Script นี้
const TasksModel = mongoose.models.Tasks || mongoose.model("Tasks", TasksSchema, "tasks");

// --- 3. Helper Functions ---
const verbs = ['Fix', 'Implement', 'Refactor', 'Design', 'Test', 'Deploy', 'Update', 'Remove'];
const nouns = ['Button', 'Header', 'API', 'Database', 'Login', 'Footer', 'Sidebar', 'Modal', 'Bug', 'Feature'];
const priorities = ['low', 'medium', 'high'];
const tagsList = ['Bug', 'Feature', 'Urgent', 'Frontend', 'Backend', 'DevOps', 'UI/UX'];

function getRandomElement(arr: any[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// --- 4. Main Script ---
async function main() {
  try {
    console.log('Connecting to MongoDB...');
    // Debug: ปริ้นดูว่า path ถูกไหม (ถ้า connect ไม่ได้ลอง uncomment ดู)
    // console.log('URI:', MONGODB_URI); 
    
    await mongoose.connect(MONGODB_URI as string);
    console.log('✅ Connected!');

    // *** ค่า ColumnId ที่คุณต้องการ ***
    const TARGET_COLUMN_ID = "6964e2a9ec4eed5590a31491";
    
    const DUMMY_USER_ID = new mongoose.Types.ObjectId(); 

    const tasks = [];
    const TOTAL_TASKS = 60;

    console.log(`Generating ${TOTAL_TASKS} tasks for Column: ${TARGET_COLUMN_ID}...`);

    for (let i = 0; i < TOTAL_TASKS; i++) {
      const checklistMock = [];
      const checklistCount = getRandomInt(0, 3);
      for(let j=0; j<checklistCount; j++) {
        checklistMock.push({ text: `Subtask ${j+1}`, done: Math.random() < 0.5 });
      }

      tasks.push({
        columnId: new mongoose.Types.ObjectId(TARGET_COLUMN_ID),
        title: `${getRandomElement(verbs)} ${getRandomElement(nouns)} ${i + 1}`,
        description: `This is generated task description #${i + 1}. Focus on performance and stability.`,
        priority: getRandomElement(priorities),
        order: i,
        dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
        tags: [getRandomElement(tagsList), getRandomElement(tagsList)],
        checklist: checklistMock,
        timeTracking: {
            estimated: getRandomInt(1, 20),
            logged: getRandomInt(0, 10)
        },
        assignees: [DUMMY_USER_ID],
        comments: [],
        attachments: [],
        archived: false,
      });
    }

    console.log('Inserting into database...');
    await TasksModel.insertMany(tasks);

    console.log(`🎉 Success! Inserted ${TOTAL_TASKS} tasks into column ${TARGET_COLUMN_ID}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
    process.exit();
  }
}

main();