"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, ChevronRight } from "lucide-react";

export default function PetTrackWidget() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const [userResponse, postsResponse] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/pettrack"),
      ]);

      const userData = await userResponse.json();
      const postsData = await postsResponse.json();

      if (userData.user && Array.isArray(postsData)) {
        // Count unread active posts
        const unread = postsData.filter(
          (post) => !post.isResolved && !post.readBy.includes(userData.user.id),
        ).length;

        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={() => router.push("/pettrack")}
      className="bg-[#f5f7f3] border border-[#dbe1d4] rounded-2xl p-6 hover:bg-[#eef2e9] hover:shadow-sm transition cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#697a63] p-3 rounded-lg">
            <MessageSquare className="text-white" size={24} />
          </div>
          <h3 className="text-2xl font-bold text-[#4f5a4c]">PetTrack</h3>
        </div>
        <ChevronRight className="text-[#697a63]" size={24} />
      </div>

      {loading ? (
        <p className="text-[#697a63]">Loading...</p>
      ) : unreadCount > 0 ? (
        <div>
          <p className="text-[#4f5a4c] text-lg font-semibold">
            {unreadCount} new {unreadCount === 1 ? "post" : "posts"}
          </p>
          <p className="text-[#697a63] text-sm">
            Click to view unread issues
          </p>
        </div>
      ) : (
        <p className="text-[#697a63]">All caught up!</p>
      )}
    </div>
  );
}
