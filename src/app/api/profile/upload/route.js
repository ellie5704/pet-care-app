import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { v2 as cloudinary } from "cloudinary";
import dbConnect from "@/lib/db";
import User from "@/models/user";
import { sessionOptions } from "@/lib/session";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession(cookieStore, sessionOptions);

    if (!session.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(session.userId);
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type?.startsWith("image/")) {
      return Response.json({ error: "Please upload an image file" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `users/${session.userId}`,
          public_id: "avatar",
          overwrite: true,
          resource_type: "image",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );

      uploadStream.end(buffer);
    });

    user.avatar = uploadResult.secure_url;
    await user.save();

    return Response.json({
      success: true,
      url: uploadResult.secure_url,
    });
  } catch (error) {
    console.error("Profile upload error:", error);
    return Response.json(
      { error: error.message || "Failed to upload profile image" },
      { status: 500 },
    );
  }
}

