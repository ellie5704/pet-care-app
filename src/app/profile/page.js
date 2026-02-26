"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [household, setHousehold] = useState(null);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editingHousehold, setEditingHousehold] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingHousehold, setSavingHousehold] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    bio: "",
  });
  const [householdName, setHouseholdName] = useState("");

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();

      if (!data.user) {
        router.push("/login");
        return;
      }

      setUser(data.user);
      setFormData({
        name: data.user.name || "",
        phone: data.user.phone || "",
        address: data.user.address || "",
        bio: data.user.bio || "",
      });

      const householdResponse = await fetch("/api/household");
      const householdData = await householdResponse.json();
      if (householdData.success) {
        setHousehold(householdData.household);
        setHouseholdName(householdData.household.name || "");
      }

      const membersResponse = await fetch("/api/household/members");
      const membersData = await membersResponse.json();
      if (membersData.success && Array.isArray(membersData.members)) {
        setFriends(
          membersData.members.filter(
            (member) => member.id.toString() !== data.user.id.toString(),
          ),
        );
      }
    } catch (error) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        setEditing(false);
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || "",
      phone: user.phone || "",
      address: user.address || "",
      bio: user.bio || "",
    });
    setEditing(false);
  };

  const handleSaveHousehold = async () => {
    if (!householdName.trim()) return;
    setSavingHousehold(true);

    try {
      const response = await fetch("/api/household", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: householdName.trim() }),
      });

      const data = await response.json();
      if (data.success) {
        setHousehold(data.household);
        setHouseholdName(data.household.name || "");
        setEditingHousehold(false);
      } else {
        alert(data.error || "Failed to update household");
      }
    } catch (error) {
      alert("Failed to update household");
    } finally {
      setSavingHousehold(false);
    }
  };

  const handleCancelHousehold = () => {
    setHouseholdName(household?.name || "");
    setEditingHousehold(false);
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setInviteMessage("");

    try {
      const response = await fetch("/api/invite/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });

      const data = await response.json();
      if (data.success) {
        setInviteMessage("Invitation sent successfully.");
        setInviteEmail("");
      } else {
        setInviteMessage(data.error || "Failed to send invitation.");
      }
    } catch (error) {
      setInviteMessage("Failed to send invitation.");
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("file", file);

    try {
      setUploadingAvatar(true);
      const response = await fetch("/api/profile/upload", {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setUser((prev) => ({
          ...prev,
          avatar: data.url,
        }));
        window.dispatchEvent(new Event("auth-change"));
      } else {
        alert(data.error || "Failed to upload profile image.");
      }
    } catch (error) {
      alert("Failed to upload profile image.");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-5 bg-gradient-to-br from-[#f5f7f3] via-[#f9faf7] to-[#eef3e8]">
      <div className="space-y-6">
        <div className="flex justify-between items-center py-2">
          <h1 className="text-2xl text-[#4f5a4c] font-semibold">My Profile</h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-5 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white p-8 rounded-2xl shadow-md border border-[#dbe1d4]">
            <h2 className="text-xl text-[#4f5a4c] font-semibold mb-6">
              User Information
            </h2>
            <div className="border-b-2 border-[#cfd8c8] mb-6" />

            <div className="flex justify-center mb-8">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={`${user?.name || "User"} profile`}
                  className="w-24 h-24 rounded-full object-cover border border-[#cfd8c8]"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#f1f4ed] to-[#dfe8d6] text-[#5d7059] flex items-center justify-center text-4xl font-semibold border border-[#cfd8c8]">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex justify-center">
                  <label className="px-4 py-2 rounded bg-[#697a63] text-white hover:bg-[#55624f] transition cursor-pointer">
                    {uploadingAvatar ? "Uploading..." : "Upload Profile Picture"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Bio
                  </label>
                  <textarea
                    rows={4}
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded resize-y"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded text-white bg-[#5f735b] hover:bg-[#4e614b] disabled:opacity-70"
                  >
                    {saving ? "Saving..." : "Save Profile"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-4 py-2 rounded bg-[#9aa59a] text-white hover:bg-[#7f8a7f] disabled:opacity-70"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-5">
                <ProfileField label="Full Name" value={user?.name} />
                <ProfileField label="Email" value={user?.email} />
                <ProfileField label="Phone Number" value={user?.phone} />
                <ProfileField label="Address" value={user?.address} />
                <ProfileField label="Bio" value={user?.bio} multiline />

                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-[#9aa59a] text-white rounded hover:bg-[#7f8a7f] transition"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </section>

          <section className="bg-white p-8 rounded-2xl shadow-md border border-[#dbe1d4]">
            <h2 className="text-xl text-[#4f5a4c] font-semibold mb-6">
              Household
            </h2>
            <div className="border-b-2 border-[#cfd8c8] mb-6" />

            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Household Name
              </label>
              {editingHousehold ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={householdName}
                    onChange={(e) => setHouseholdName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleSaveHousehold}
                      disabled={savingHousehold}
                      className="px-4 py-2 rounded text-white bg-[#5f735b] hover:bg-[#4e614b] disabled:opacity-70"
                    >
                      {savingHousehold ? "Saving..." : "Save Household"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelHousehold}
                      disabled={savingHousehold}
                      className="px-4 py-2 rounded bg-[#9aa59a] text-white hover:bg-[#7f8a7f] disabled:opacity-70"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-gray-800">
                    {household?.name || "No household name"}
                  </p>
                  <button
                    type="button"
                    onClick={() => setEditingHousehold(true)}
                    className="px-4 py-2 bg-[#9aa59a] text-white rounded hover:bg-[#7f8a7f] transition"
                  >
                    Edit Household
                  </button>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-[#f2f6ee] to-[#e8efe1] border border-[#dbe1d4] p-5 rounded-xl">
              <h3 className="text-lg font-semibold text-[#4f5a4c] mb-3">
                Household Members
              </h3>
              {friends.length > 0 ? (
                <div className="space-y-3">
                  {friends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between bg-white border border-[#dbe1d4] rounded-lg p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#697a63] text-white flex items-center justify-center font-semibold">
                          {friend.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {friend.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {friend.email}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-[#dbe1d4] text-[#4f5a4c] capitalize">
                        {friend.role}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  No other members in household yet.
                </p>
              )}
            </div>

            <div className="border-b-2 border-[#cfd8c8] my-6" />

            <div className="bg-gradient-to-br from-[#f2f6ee] to-[#e8efe1] border border-[#dbe1d4] p-5 rounded-xl">
              <h3 className="text-lg font-semibold text-[#4f5a4c] mb-3">
                Invite People To Your Household
              </h3>
              <form onSubmit={handleSendInvite} className="space-y-3">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="friend@example.com"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-[#697a63] text-white hover:bg-[#55624f] transition"
                >
                  Send Invite
                </button>
              </form>
              {inviteMessage && (
                <p className="text-sm text-gray-700 mt-3">{inviteMessage}</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function ProfileField({ label, value, multiline }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-400 uppercase mb-1">
        {label}
      </div>
      <div
        className={`text-gray-800 ${
          multiline ? "leading-relaxed whitespace-pre-wrap" : ""
        }`}
      >
        {value || "Not provided"}
      </div>
    </div>
  );
}
