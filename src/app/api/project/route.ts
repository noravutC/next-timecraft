// app/api/projects/route.ts
import clientPromise from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("TimeCraft");
    const response = await db.collection("projects").find().toArray();
    return NextResponse.json(
      {
        success: true,
        message: "Success to get data from projects!",
        data: response,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch projects",
        data: [],
        error: error,
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const client = await clientPromise;
    const db = client.db('TimeCraft');
    const projectsCollection = db.collection('projects');

    // const seedData = [
    //   {
    //     _id: new ObjectId(),
    //     project_name: "DTO",
    //     project_url: "Project URL",
    //     project_type: "Project Type",
    //     columns: [
    //       {
    //         column_name: "Dreamia",
    //         column_id: new ObjectId(),
    //         tasks: [
    //           {
    //             task_id: new ObjectId(),
    //             task_title: "Coultervillle",
    //             assign_to: "browny",
    //             start_date: "2025-05-17T22:16:18+07:00",
    //             end_date: "2025-05-17T22:16:18+07:00",
    //             create_by: "June"
    //           }
    //         ]
    //       },
    //       {
    //         column_name: "Ultrimax",
    //         column_id: new ObjectId(),
    //         tasks: [
    //           {
    //             task_id: new ObjectId(),
    //             task_title: "Grapeview",
    //             assign_to: "green apple",
    //             start_date: "2025-05-17T22:16:18+07:00",
    //             end_date: "2025-05-17T22:16:18+07:00",
    //             create_by: "Green"
    //           }
    //         ]
    //       }
    //     ],
    //     member: []
    //   }
    // ];
    const seedData = generateData(3);
    const result = await projectsCollection.insertMany(seedData);

    return NextResponse.json({
      success: true,
      message: 'Seed data created successfully!',
      data: result.insertedIds
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating seed data:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create seed data',
      error: error
    }, { status: 500 });
  }
}



interface Task {
  task_id: ObjectId;
  task_title: string;
  assign_to: string;
  start_date: string;
  end_date: string;
  create_by: string;
}

interface Column {
  column_name: string;
  column_id: ObjectId;
  tasks: Task[];
}

interface Project {
  _id: ObjectId;
  project_name: string;
  project_url: string;
  project_type: string;
  columns: Column[];
  member: string[];
}

const randomString = (length: number): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const randomDate = (): string => {
  const start = new Date(2025, 0, 1).getTime();
  const end = new Date(2025, 11, 31).getTime();
  const date = new Date(start + Math.random() * (end - start));
  return date.toISOString();
};

export const generateData = (count: number): Project[] => {
  return Array.from({ length: count }).map(() => {
    const projectId = new ObjectId();
    const project = {
      _id: projectId,
      project_name: `Project_${randomString(5)}`,
      project_url: `https://example.com/${randomString(10)}`,
      project_type: randomString(7),
      columns: Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map(() => {
        const columnId = new ObjectId();
        return {
          column_name: `Column_${randomString(6)}`,
          column_id: columnId,
          tasks: Array.from({ length: Math.floor(Math.random() * 5) + 1 }).map(() => {
            return {
              task_id: new ObjectId(),
              task_title: `Task_${randomString(8)}`,
              assign_to: randomString(6),
              start_date: randomDate(),
              end_date: randomDate(),
              create_by: randomString(5),
            };
          })
        };
      }),
      member: Array.from({ length: Math.floor(Math.random() * 5) }).map(() => randomString(7))
    };
    return project;
  });
};

export const seedDatabase = async (): Promise<Project[]> => {
  return generateData(5);
};
