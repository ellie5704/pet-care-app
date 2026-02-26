import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import dbConnect from "@/lib/db";
import User from "@/models/user";
import PetTrackPost from "@/models/PetTrackPost";
import HouseholdMember from "@/models/householdMembers";
import { sessionOptions } from "@/lib/session";

export async function GET(request, { params }) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession(cookieStore, sessionOptions);

    if (!session.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { id } = await params;
    const user = await User.findById(session.userId);

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const post = await PetTrackPost.findById(id)
      .populate("petId", "name profileImage")
      .populate("authorId", "name email")
      .populate("assignedTo", "name email")
      .populate("resolvedBy", "name")
      .populate("replies.authorId", "name email");

    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.householdId.toString() !== user.householdId.toString()) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Mark as read by current user
    if (!post.readBy.includes(session.userId)) {
      post.readBy.push(session.userId);
      await post.save();
    }

    return Response.json(post);
  } catch (error) {
    console.error("Get post error:", error);
    return Response.json(
      { error: error.message || "Failed to get post" },
      { status: 500 },
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession(cookieStore, sessionOptions);

    if (!session.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { id } = await params;
    const updates = await request.json();
    const user = await User.findById(session.userId);

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const post = await PetTrackPost.findById(id);

    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.householdId.toString() !== user.householdId.toString()) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Only author can edit post content
    if (updates.title || updates.content || updates.petId) {
      if (post.authorId.toString() !== session.userId) {
        return Response.json(
          { error: "Only the author can edit this post" },
          { status: 403 },
        );
      }

      if (updates.title) post.title = updates.title;
      if (updates.content) post.content = updates.content;
      if (updates.petId) post.petId = updates.petId;
    }

    // Author or household owner can reassign issue.
    if (Object.prototype.hasOwnProperty.call(updates, "assignedTo")) {
      let canAssign = post.authorId.toString() === session.userId;

      if (!canAssign) {
        const membership = await HouseholdMember.findOne({
          householdId: user.householdId,
          userId: user._id,
        });
        canAssign = membership?.role === "owner";
      }

      if (!canAssign) {
        return Response.json(
          { error: "Only the author or household owner can assign issues" },
          { status: 403 },
        );
      }

      if (!updates.assignedTo) {
        post.assignedTo = null;
      } else {
        const assigneeMembership = await HouseholdMember.findOne({
          householdId: user.householdId,
          userId: updates.assignedTo,
        });

        if (!assigneeMembership) {
          return Response.json(
            { error: "Assigned user must be in your household" },
            { status: 400 },
          );
        }

        post.assignedTo = updates.assignedTo;
      }
    }

    // Only owner can resolve/unresolve posts
    if (updates.isResolved !== undefined) {
      const membership = await HouseholdMember.findOne({
        householdId: user.householdId,
        userId: user._id,
      });

      if (!membership || membership.role !== "owner") {
        return Response.json(
          { error: "Only household owners can resolve posts" },
          { status: 403 },
        );
      }

      post.isResolved = updates.isResolved;
      if (updates.isResolved) {
        post.resolvedAt = new Date();
        post.resolvedBy = session.userId;
      } else {
        post.resolvedAt = null;
        post.resolvedBy = null;
      }
    }

    await post.save();

    await post.populate("petId", "name profileImage");
    await post.populate("authorId", "name email");
    await post.populate("assignedTo", "name email");
    await post.populate("resolvedBy", "name");
    await post.populate("replies.authorId", "name email");

    return Response.json(post);
  } catch (error) {
    console.error("Update post error:", error);
    return Response.json(
      { error: error.message || "Failed to update post" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession(cookieStore, sessionOptions);

    if (!session.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { id } = await params;
    const user = await User.findById(session.userId);

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const post = await PetTrackPost.findById(id);

    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.householdId.toString() !== user.householdId.toString()) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Only author can delete
    if (post.authorId.toString() !== session.userId) {
      return Response.json(
        { error: "Only the author can delete this post" },
        { status: 403 },
      );
    }

    await PetTrackPost.findByIdAndDelete(id);

    return Response.json({ success: true, message: "Post deleted" });
  } catch (error) {
    console.error("Delete post error:", error);
    return Response.json(
      { error: error.message || "Failed to delete post" },
      { status: 500 },
    );
  }
}
