"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  MessageSquare,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Loader,
  ArrowLeft,
  Send,
  Clock,
} from "lucide-react";

export default function PetTrackPage() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [pets, setPets] = useState([]);
  const [householdMembers, setHouseholdMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [viewingPost, setViewingPost] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [formData, setFormData] = useState({
    petId: "",
    title: "",
    content: "",
    assignedTo: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const userResponse = await fetch("/api/auth/me");
      const userData = await userResponse.json();

      if (!userData.user) {
        router.push("/login");
        return;
      }

      setCurrentUser(userData.user);

      const membersResponse = await fetch("/api/household/members");
      const membersData = await membersResponse.json();

      if (membersData.success) {
        setHouseholdMembers(membersData.members);
        const currentMember = membersData.members.find(
          (m) => m.id.toString() === userData.user.id.toString(),
        );
        setIsOwner(currentMember?.role === "owner");
      }

      const petsResponse = await fetch("/api/pets");
      const petsData = await petsResponse.json();
      setPets(Array.isArray(petsData) ? petsData : []);

      const postsResponse = await fetch("/api/pettrack");
      const postsData = await postsResponse.json();
      setPosts(Array.isArray(postsData) ? postsData : []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let response;
      if (editingPost) {
        response = await fetch(`/api/pettrack/${editingPost._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
      } else {
        response = await fetch("/api/pettrack", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
      }

      if (response.ok) {
        await fetchData();
        resetForm();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || "Failed to save post"}`);
      }
    } catch (error) {
      console.error("Error saving post:", error);
      alert("Error saving post. Please try again.");
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingPost(null);
    setFormData({
      petId: "",
      title: "",
      content: "",
      assignedTo: "",
    });
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      petId: post.petId._id,
      title: post.title,
      content: post.content,
      assignedTo: post.assignedTo?._id || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (postId) => {
    if (confirm("Are you sure you want to delete this post?")) {
      try {
        const response = await fetch(`/api/pettrack/${postId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          await fetchData();
          if (viewingPost?._id === postId) {
            setViewingPost(null);
          }
        } else {
          const errorData = await response.json();
          alert(`Error: ${errorData.error || "Failed to delete post"}`);
        }
      } catch (error) {
        console.error("Error deleting post:", error);
      }
    }
  };

  const handleResolve = async (postId, isResolved) => {
    if (!isOwner) {
      alert("Only household owners can resolve posts");
      return;
    }

    try {
      const response = await fetch(`/api/pettrack/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isResolved }),
      });

      if (response.ok) {
        await fetchData();
        if (viewingPost?._id === postId) {
          const data = await response.json();
          setViewingPost(data);
        }
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || "Failed to resolve post"}`);
      }
    } catch (error) {
      console.error("Error resolving post:", error);
    }
  };

  const handleViewPost = async (postId) => {
    try {
      const response = await fetch(`/api/pettrack/${postId}`);
      const data = await response.json();

      if (response.ok) {
        setViewingPost(data);
        await fetchData();
      }
    } catch (error) {
      console.error("Error viewing post:", error);
    }
  };

  const handleAddReply = async (e) => {
    e.preventDefault();

    if (!replyContent.trim()) return;

    try {
      const response = await fetch(`/api/pettrack/${viewingPost._id}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: replyContent }),
      });

      if (response.ok) {
        const updatedPost = await response.json();
        setViewingPost(updatedPost);
        setReplyContent("");
        await fetchData();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || "Failed to add reply"}`);
      }
    } catch (error) {
      console.error("Error adding reply:", error);
    }
  };

  const isUnread = (post) => {
    return !post.readBy.includes(currentUser?.id);
  };

  const getUnreadCount = () => {
    return posts.filter((post) => !post.isResolved && isUnread(post)).length;
  };

  const activePosts = posts.filter((post) => !post.isResolved);
  const resolvedPosts = posts.filter((post) => post.isResolved);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9faf7] flex items-center justify-center">
        <Loader className="animate-spin text-[#697a63]" size={32} />
      </div>
    );
  }

  if (viewingPost) {
    return (
      <div className="min-h-screen bg-[#f9faf7] p-4 md:p-6">
        <div className="space-y-6">
          <button
            onClick={() => setViewingPost(null)}
            className="flex items-center gap-2 text-[#697a63] hover:text-[#4f5a4c] transition"
          >
            <ArrowLeft size={20} />
            Back to Posts
          </button>

          <div
            className={`rounded-2xl border shadow-sm overflow-hidden ${
              viewingPost.isResolved
                ? "bg-[#f2f4ee] border-[#d4dbce]"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h1
                    className={`text-3xl font-bold mb-2 ${
                      viewingPost.isResolved ? "text-gray-500" : "text-[#4f5a4c]"
                    }`}
                  >
                    {viewingPost.title}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>
                      By <strong>{viewingPost.authorId.name}</strong>
                    </span>
                    <span>-</span>
                    <span>{new Date(viewingPost.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {viewingPost.authorId._id === currentUser?.id && (
                    <>
                      <button
                        onClick={() => handleEdit(viewingPost)}
                        className="p-2 text-[#697a63] hover:bg-[#dbe1d4] rounded-lg transition"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(viewingPost._id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                  {isOwner && (
                    <button
                      onClick={() =>
                        handleResolve(viewingPost._id, !viewingPost.isResolved)
                      }
                      className={`p-2 rounded-lg transition ${
                        viewingPost.isResolved
                          ? "text-orange-500 hover:bg-orange-50"
                          : "text-[#697a63] hover:bg-[#dbe1d4]"
                      }`}
                      title={
                        viewingPost.isResolved
                          ? "Mark as unresolved"
                          : "Mark as resolved"
                      }
                    >
                      {viewingPost.isResolved ? (
                        <XCircle size={18} />
                      ) : (
                        <CheckCircle size={18} />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4">
                {viewingPost.petId?.profileImage ? (
                  <img
                    src={viewingPost.petId.profileImage}
                    alt={viewingPost.petId.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#697a63] text-white flex items-center justify-center">
                    P
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">
                    {viewingPost.petId?.name}
                  </p>
                  <p className="text-sm text-gray-600">Pet in question</p>
                  <p className="text-sm text-gray-600">
                    Assigned to: {viewingPost.assignedTo?.name || "Unassigned"}
                  </p>
                </div>
              </div>

              {viewingPost.isResolved && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#dbe1d4] text-[#4f5a4c] rounded-full text-sm">
                  <CheckCircle size={16} />
                  <span>
                    Resolved by {viewingPost.resolvedBy?.name} on{" "}
                    {new Date(viewingPost.resolvedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <div className="p-6 border-b border-gray-200">
              <p
                className={`whitespace-pre-wrap ${
                  viewingPost.isResolved ? "text-gray-500" : "text-gray-900"
                }`}
              >
                {viewingPost.content}
              </p>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-bold text-[#4f5a4c] mb-4">
                Replies ({viewingPost.replies.length})
              </h3>

              {viewingPost.replies.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {viewingPost.replies.map((reply, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-[#697a63] pl-4 py-2"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-full bg-[#697a63] text-white flex items-center justify-center text-xs font-bold">
                          {reply.authorId.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-900">
                          {reply.authorId.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(reply.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-700 ml-10">{reply.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-6">
                  No replies yet. Be the first to reply.
                </p>
              )}

              <form onSubmit={handleAddReply} className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add a Reply
                </label>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows="3"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-[#dbe1d4]"
                  placeholder="Write your reply..."
                  required
                ></textarea>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-[#697a63] text-white px-4 py-2 rounded-lg hover:bg-[#55624f] transition"
                >
                  <Send size={18} />
                  Send Reply
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9faf7] p-4 md:p-6">
      <div className="bg-white shadow-md rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-semibold text-[#4f5a4c] tracking-tight">
              Pet Track
            </h1>
            <p className="text-[#9aa59a] mt-1 py-2">
              Track and discuss pet issues with your household
            </p>
            <p className="text-sm text-[#697a63] mt-2">
              {getUnreadCount()} unread active post
              {getUnreadCount() === 1 ? "" : "s"}
            </p>
          </div>
          <button
            onClick={() => {
              setEditingPost(null);
              setFormData({ petId: "", title: "", content: "", assignedTo: "" });
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            <Plus size={20} />
            New Post
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-[#4f5a4c] mb-4">
            Active Issues ({activePosts.length})
          </h2>

          {activePosts.length > 0 ? (
            <div className="space-y-3">
              {activePosts.map((post) => (
                <div
                  key={post._id}
                  onClick={() => handleViewPost(post._id)}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-[#f5f7f3] transition cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3
                        className={`text-lg mb-1 ${
                          isUnread(post)
                            ? "font-bold text-gray-900"
                            : "font-medium text-gray-700"
                        }`}
                      >
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
                        <span className="flex items-center gap-1">
                          {post.petId?.profileImage ? (
                            <img
                              src={post.petId.profileImage}
                              alt={post.petId.name}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-[#697a63]">
                              <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M19.9801 9.0625L20.7301 9.06545V9.0625H19.9801ZM4.01995 9.0625H3.26994L3.26995 9.06545L4.01995 9.0625ZM19.0993 10.6602L18.5268 11.1447L18.6114 11.2447L18.725 11.3101L19.0993 10.6602ZM18.8279 9.39546C18.494 9.15031 18.0246 9.22224 17.7795 9.55611C17.5343 9.88999 17.6063 10.3594 17.9401 10.6045L18.8279 9.39546ZM4.01994 15L3.26994 15V15H4.01994ZM6.05987 10.6045C6.39375 10.3594 6.46568 9.88999 6.22053 9.55612C5.97538 9.22224 5.50598 9.15031 5.1721 9.39546L6.05987 10.6045ZM12 5.65636C11.2279 5.65636 10.7904 5.69743 10.4437 5.74003C10.1041 5.78176 9.93161 5.8125 9.60601 5.8125V7.3125C10.0465 7.3125 10.3308 7.26518 10.6266 7.22883C10.9153 7.19336 11.2918 7.15636 12 7.15636V5.65636ZM12 7.15636C12.7083 7.15636 13.0847 7.19336 13.3734 7.22883C13.6692 7.26518 13.9536 7.3125 14.394 7.3125V5.8125C14.0684 5.8125 13.896 5.78176 13.5563 5.74003C13.2097 5.69743 12.7721 5.65636 12 5.65636V7.15636ZM14.394 7.3125C14.6069 7.3125 14.8057 7.25192 14.9494 7.19867C15.1051 7.14099 15.2662 7.06473 15.4208 6.98509C15.7257 6.82803 16.0797 6.61814 16.4042 6.43125C16.7431 6.23612 17.064 6.0575 17.3512 5.92771C17.6589 5.78868 17.8349 5.75011 17.9053 5.75011V4.25011C17.4968 4.25011 17.0743 4.40685 16.7336 4.56076C16.3725 4.72392 15.9951 4.9359 15.6557 5.13136C15.3019 5.33508 14.9976 5.51578 14.7338 5.65167C14.6041 5.7185 14.5034 5.7643 14.4284 5.79206C14.3415 5.82426 14.3408 5.8125 14.394 5.8125V7.3125ZM17.9053 5.75011C18.2495 5.75011 18.58 5.85266 18.8122 6.0527C19.0237 6.23486 19.2301 6.56231 19.2301 7.18761H20.7301C20.7301 6.18792 20.3778 5.42162 19.7913 4.91628C19.2255 4.42882 18.5186 4.25011 17.9053 4.25011V5.75011ZM19.2301 7.18761V9.0625H20.7301V7.18761H19.2301ZM9.60601 5.8125C9.65925 5.8125 9.65855 5.82426 9.57164 5.79206C9.49668 5.7643 9.39595 5.71849 9.26624 5.65166C9.00249 5.51576 8.69813 5.33504 8.34437 5.13132C8.00493 4.93584 7.62754 4.72384 7.26643 4.56067C6.92577 4.40675 6.5032 4.25 6.09476 4.25V5.75C6.16512 5.75 6.34105 5.78856 6.64878 5.92761C6.93605 6.05741 7.25693 6.23603 7.5958 6.43118C7.92035 6.61808 8.27434 6.82799 8.57919 6.98506C8.73377 7.06471 8.89488 7.14098 9.05059 7.19866C9.19436 7.25191 9.39317 7.3125 9.60601 7.3125V5.8125ZM6.09476 4.25C5.48139 4.25 4.77453 4.42871 4.20872 4.91616C3.62216 5.4215 3.26995 6.18781 3.26995 7.1875H4.76995C4.76995 6.56219 4.97634 6.23475 5.18778 6.05259C5.41998 5.85254 5.75053 5.75 6.09476 5.75V4.25ZM3.26995 7.1875V9.0625H4.76995V7.1875H3.26995ZM12 20.75C13.431 20.75 15.5401 20.4654 17.3209 19.6462C19.1035 18.8262 20.7301 17.3734 20.7301 15H19.2301C19.2301 16.5328 18.2232 17.58 16.694 18.2835C15.1631 18.9877 13.2822 19.25 12 19.25V20.75ZM19.6719 10.1758C19.437 9.89818 19.1575 9.63749 18.8279 9.39546L17.9401 10.6045C18.1808 10.7813 18.3726 10.9625 18.5268 11.1447L19.6719 10.1758ZM19.2301 9.05955C19.2293 9.25778 19.1888 9.67007 19.0916 9.95501C19.0374 10.1139 19.0062 10.1101 19.0627 10.0649C19.1075 10.0289 19.1902 9.98403 19.3002 9.97847C19.4051 9.97317 19.468 10.007 19.4737 10.0103L18.725 11.3101C18.9057 11.4142 19.1272 11.4891 19.3759 11.4766C19.6297 11.4637 19.8412 11.3633 20.0013 11.2349C20.2881 11.0048 20.4331 10.6686 20.5113 10.4392C20.679 9.94758 20.7289 9.35941 20.7301 9.06545L19.2301 9.05955ZM12 19.25C10.7178 19.25 8.83685 18.9877 7.30594 18.2835C5.7768 17.5801 4.76994 16.5328 4.76994 15H3.26994C3.26994 17.3734 4.89649 18.8262 6.67907 19.6462C8.45988 20.4654 10.5689 20.75 12 20.75V19.25ZM4.76994 15C4.76994 14.2119 4.71349 13.5629 4.7889 12.8724C4.85939 12.227 5.04214 11.6541 5.47321 11.1447L4.32811 10.1758C3.64728 10.9804 3.38966 11.8682 3.29777 12.7095C3.2108 13.5058 3.26994 14.3696 3.26994 15L4.76994 15ZM5.47321 11.1447C5.62738 10.9625 5.81916 10.7813 6.05987 10.6045L5.1721 9.39546C4.84248 9.63749 4.56299 9.89818 4.32811 10.1758L5.47321 11.1447ZM3.26995 9.06545C3.27111 9.35941 3.32101 9.94757 3.48871 10.4392C3.56694 10.6686 3.71186 11.0048 3.99873 11.2349C4.15878 11.3633 4.3703 11.4637 4.62412 11.4766C4.87277 11.4891 5.0943 11.4142 5.27501 11.3101L4.52631 10.0103C4.53204 10.007 4.59487 9.97317 4.69976 9.97847C4.80981 9.98403 4.89252 10.0289 4.93734 10.0649C4.99376 10.1101 4.96261 10.1139 4.9084 9.95501C4.81121 9.67007 4.77072 9.25778 4.76994 9.05955L3.26995 9.06545Z" fill="#697a63"></path> <path d="M12.826 16C12.826 16.1726 12.465 16.3125 12.0196 16.3125C11.5742 16.3125 11.2131 16.1726 11.2131 16C11.2131 15.8274 11.5742 15.6875 12.0196 15.6875C12.465 15.6875 12.826 15.8274 12.826 16Z" stroke="#697a63" strokeWidth="1.5"></path> <path d="M15.5 13.5938C15.5 14.0252 15.2834 14.375 15.0161 14.375C14.7489 14.375 14.5323 14.0252 14.5323 13.5938C14.5323 13.1623 14.7489 12.8125 15.0161 12.8125C15.2834 12.8125 15.5 13.1623 15.5 13.5938Z" stroke="#697a63" strokeWidth="1.5"></path> <path d="M9.5 13.5938C9.5 14.0252 9.28336 14.375 9.01613 14.375C8.74889 14.375 8.53226 14.0252 8.53226 13.5938C8.53226 13.1623 8.74889 12.8125 9.01613 12.8125C9.28336 12.8125 9.5 13.1623 9.5 13.5938Z" stroke="#697a63" strokeWidth="1.5"></path> <path d="M22.0004 15.4688C21.5165 15.1562 19.4197 14.375 18.6133 14.375" stroke="#697a63" strokeWidth="1.5" strokeLinecap="round"></path> <path d="M20.3871 17.9688C19.9033 17.6562 18.7742 16.875 17.9678 16.875" stroke="#697a63" strokeWidth="1.5" strokeLinecap="round"></path> <path d="M2 15.4688C2.48387 15.1562 4.58065 14.375 5.3871 14.375" stroke="#697a63" strokeWidth="1.5" strokeLinecap="round"></path> <path d="M3.61279 17.9688C4.09667 17.6562 5.2257 16.875 6.03215 16.875" stroke="#697a63" strokeWidth="1.5" strokeLinecap="round"></path> </g> </svg>
                            </span>
                          )}
                          {post.petId?.name}
                        </span>
                        <span>-</span>
                        <span>By {post.authorId.name}</span>
                        <span>-</span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                        <span>-</span>
                        <span className="flex items-center gap-1">
                          <MessageSquare size={14} />
                          {post.replies.length} replies
                        </span>
                        <span>-</span>
                        <span>
                          Assigned to: {post.assignedTo?.name || "Unassigned"}
                        </span>
                      </div>
                    </div>
                    {isUnread(post) && (
                      <span className="px-2 py-1 bg-[#697a63] text-white text-xs font-bold rounded-full">
                        NEW
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No active issues. All caught up.
            </p>
          )}
        </div>

        {resolvedPosts.length > 0 && (
          <div className="bg-[#f2f4ee] rounded-2xl border border-[#d4dbce] p-6">
            <h2 className="text-xl font-bold text-gray-600 mb-4">
              Resolved Issues ({resolvedPosts.length})
            </h2>

            <div className="space-y-3">
              {resolvedPosts.map((post) => (
                <div
                  key={post._id}
                  onClick={() => handleViewPost(post._id)}
                  className="bg-[#e9eee2] border border-[#d4dbce] rounded-lg p-4 hover:bg-[#dfe7d6] transition cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-500 mb-1">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          {post.petId?.profileImage ? (
                            <img
                              src={post.petId.profileImage}
                              alt={post.petId.name}
                              className="w-5 h-5 rounded-full object-cover opacity-60"
                            />
                          ) : (
                            <span>P</span>
                          )}
                          {post.petId?.name}
                        </span>
                        <span>-</span>
                        <span>Resolved by {post.resolvedBy?.name || "Admin"}</span>
                        <span>-</span>
                        <span>
                          Assigned to: {post.assignedTo?.name || "Unassigned"}
                        </span>
                      </div>
                    </div>
                    <CheckCircle size={20} className="text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-[#4f5a4c] mb-6">
                {editingPost ? "Edit Post" : "New Post"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pet *
                  </label>
                  <select
                    name="petId"
                    value={formData.petId}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="">Select a pet</option>
                    {pets.map((pet) => (
                      <option key={pet._id} value={pet._id}>
                        {pet.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Brief description of the issue"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign To
                  </label>
                  <select
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="">Unassigned</option>
                    {householdMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    required
                    rows="6"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Describe the issue in detail..."
                  ></textarea>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-[#697a63] text-white px-6 py-2 rounded-lg hover:bg-[#55624f] transition"
                  >
                    {editingPost ? "Update Post" : "Create Post"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
