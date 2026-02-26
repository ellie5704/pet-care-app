"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [household, setHousehold] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [editingHouseholdName, setEditingHouseholdName] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [stats, setStats] = useState({
    pets: 0,
    tasksToday: 0,
    appointmentsUpcoming: 0,
    activeIssues: 0,
  });
  const [miniCalendarMonth, setMiniCalendarMonth] = useState(new Date());
  const [miniCalendarAppointments, setMiniCalendarAppointments] = useState([]);

  useEffect(() => {
    fetchData();
  }, [miniCalendarMonth]);

  const fetchData = async () => {
    try {
      const userResponse = await fetch("/api/auth/me");
      const userData = await userResponse.json();

      if (!userData.user) {
        router.push("/login");
        return;
      }

      setUser(userData.user);

      const householdResponse = await fetch("/api/household");
      const householdData = await householdResponse.json();

      if (householdData.success) {
        setHousehold(householdData.household);
        setNewHouseholdName(householdData.household.name);
      }

      const membersResponse = await fetch("/api/household/members");
      const membersData = await membersResponse.json();

      if (membersData.success) {
        setMembers(membersData.members);

        const currentUserMember = membersData.members.find(
          (m) => m.id.toString() === userData.user.id.toString(),
        );
        setIsOwner(currentUserMember?.role === "owner");
      }

      const today = new Date();
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      const monthStart = new Date(
        miniCalendarMonth.getFullYear(),
        miniCalendarMonth.getMonth(),
        1,
      );
      const monthEnd = new Date(
        miniCalendarMonth.getFullYear(),
        miniCalendarMonth.getMonth() + 1,
        0,
        23,
        59,
        59,
      );

      const [
        petsResponse,
        tasksResponse,
        appointmentsResponse,
        monthAppointmentsResponse,
        issuesResponse,
      ] = await Promise.all([
        fetch("/api/pets"),
        fetch(`/api/tasks?date=${today.toISOString().split("T")[0]}`),
        fetch(
          `/api/appointments?startDate=${today.toISOString()}&endDate=${weekFromNow.toISOString()}`,
        ),
        fetch(
          `/api/appointments?startDate=${monthStart.toISOString()}&endDate=${monthEnd.toISOString()}`,
        ),
        fetch("/api/pettrack"),
      ]);

      const [petsData, tasksData, appointmentsData, monthAppointmentsData, issuesData] =
        await Promise.all([
          petsResponse.json(),
          tasksResponse.json(),
          appointmentsResponse.json(),
          monthAppointmentsResponse.json(),
          issuesResponse.json(),
        ]);

      const safePets = Array.isArray(petsData) ? petsData : [];
      const safeTasks = Array.isArray(tasksData) ? tasksData : [];
      const safeAppointments = Array.isArray(appointmentsData)
        ? appointmentsData
        : [];
      const safeMonthAppointments = Array.isArray(monthAppointmentsData)
        ? monthAppointmentsData
        : [];
      const safeIssues = Array.isArray(issuesData) ? issuesData : [];

      setStats({
        pets: safePets.length,
        tasksToday: safeTasks.length,
        appointmentsUpcoming: safeAppointments.length,
        activeIssues: safeIssues.filter((issue) => !issue.isResolved).length,
      });
      setMiniCalendarAppointments(safeMonthAppointments);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
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
        setInviteMessage("SUCCESS: Invitation sent successfully!");
        setInviteEmail("");
      } else {
        setInviteMessage(`ERROR: ${data.error}`);
      }
    } catch (error) {
      setInviteMessage("ERROR: Failed to send invitation");
    }
  };

  const handleUpdateHouseholdName = async () => {
    if (!newHouseholdName.trim()) return;

    try {
      const response = await fetch("/api/household", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newHouseholdName }),
      });

      const data = await response.json();

      if (data.success) {
        setHousehold(data.household);
        setEditingHouseholdName(false);
      } else {
        alert(data.error);
      }
    } catch {
      alert("Failed to update household name");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9faf7] flex items-center justify-center">
        <p className="text-[#697a63]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9faf7] p-4 md:p-6">
      <div className="bg-white/95 shadow-xl ring-1 ring-[#dbe1d4] rounded-2xl p-6 space-y-6">
        <div className="pb-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h1 className="text-4xl text-[#4f5a4c] tracking-tight mb-2">
              Dashboard
            </h1>
            <p className="text-[#6b7867] py-2 text-lg">
              Welcome{" "}
              <button
                type="button"
                onClick={() => router.push("/profile")}
                className="text-[#697a63] hover:underline"
              >
                {user?.name}
              </button>
              !
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gradient-to-br from-[#f7faf3] to-[#edf3e6] border border-[#cfd8c8] p-5 rounded-2xl shadow-md">
            <h2 className="text-2xl text-[#4f5a4c] mb-4">
              Household
            </h2>
            <div className="flex items-center gap-3 mb-4">
              {editingHouseholdName ? (
                <>
                  <input
                    type="text"
                    value={newHouseholdName}
                    onChange={(e) => setNewHouseholdName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#dbe1d4]"
                  />

                  <button
                    onClick={handleUpdateHouseholdName}
                    className="px-4 py-2 bg-[#697a63] hover:bg-[#55624f] text-white rounded-lg transition"
                  >
                    Save
                  </button>

                  <button
                    onClick={() => {
                      setEditingHouseholdName(false);
                      setNewHouseholdName(household?.name || "");
                    }}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-xl text-[#4f5a4c]">
                    {household?.name || "Your Household"}
                  </h3>

                  {isOwner && (
                    <button
                      onClick={() => setEditingHouseholdName(true)}
                      className="px-3 py-1.5 bg-[#697a63] hover:bg-[#55624f] text-white rounded-lg text-xs transition"
                    >
                      Edit Name
                    </button>
                  )}
                </>
              )}
            </div>

            <p className="text-base text-[#4f5a4c] mb-4 font-medium">
              {members.length} member{members.length === 1 ? "" : "s"} in your
              household
            </p>

            <div className="space-y-3 mb-5">
              {members.slice(0, 3).map((member) => (
                <div
                  key={member.id}
                  className="p-3 bg-white rounded-lg flex justify-between items-center border border-[#dbe1d4] shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#697a63] text-white flex items-center justify-center text-base">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        {member.name}
                        {member.id.toString() === user.id.toString() && (
                          <span className="text-gray-500 text-xs ml-2">
                            (You)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#4f5a4c]">{member.email}</div>
                    </div>
                  </div>
                  <div
                    className={`inline-block px-2 py-1 rounded text-xs font-medium capitalize ${
                      member.role === "owner"
                        ? "bg-[#697a63] text-white"
                        : "bg-gray-500 text-white"
                    }`}
                  >
                    {member.role}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendInvite} className="space-y-3">
              <label className="block text-sm font-medium">Invite Someone</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="friend@example.com"
                  required
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-[#243022] focus:outline-none focus:ring-2 focus:ring-[#dbe1d4]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#697a63] hover:bg-[#55624f] text-white rounded-lg text-sm font-medium transition"
                >
                  Invite
                </button>
              </div>
            </form>

            {inviteMessage && (
              <div
                className={`mt-3 p-3 rounded-md text-sm ${
                  inviteMessage.startsWith("SUCCESS:")
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {inviteMessage.replace("SUCCESS: ", "").replace("ERROR: ", "")}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-white to-[#f7faf3] p-4 rounded-2xl border border-[#dbe1d4] shadow-md">
            <h2 className="text-xl text-[#4f5a4c] mb-3">
              Profile
            </h2>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-[#697a63] text-white flex items-center justify-center text-xl">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="text-lg text-[#243022]">{user?.name}</p>
                <p className="text-sm text-[#4f5a4c]">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => router.push("/profile")}
              className="w-full px-4 py-2 bg-[#697a63] hover:bg-[#55624f] text-white rounded-lg text-sm transition"
            >
              View Profile
            </button>

            <div className="mt-5 pt-4 border-t border-gray-200">
              <h3 className="text-base text-[#4f5a4c] mb-3">
                Friends
              </h3>
              <div className="space-y-2">
                {members
                  .filter((member) => member.id.toString() !== user.id.toString())
                  .slice(0, 4)
                  .map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between bg-[#f5f7f3] border border-[#dbe1d4] rounded-lg px-2 py-2 shadow-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-[#697a63] text-white flex items-center justify-center text-sm">
                          {friend.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <p className="text-sm text-[#243022] font-medium truncate">
                          {friend.name}
                        </p>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-[#dbe1d4] text-gray-600 capitalize">
                        {friend.role}
                      </span>
                    </div>
                  ))}
                {members.filter(
                  (member) => member.id.toString() !== user.id.toString(),
                ).length === 0 && (
                  <p className="text-sm text-[#4f5a4c]">
                    No friends in household yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <button
            onClick={() => router.push("/pets")}
            className="text-left bg-gradient-to-br from-white to-[#f6faf2] p-5 rounded-2xl border border-[#dbe1d4] shadow-md hover:shadow-lg hover:-translate-y-0.5 transition"
          >
            <p className="text-base text-[#4f5a4c] font-medium">Pets</p>
            <p className="text-5xl text-[#243022]">
              {stats.pets}
            </p>
            <p className="text-base text-[#4f5a4c] mt-2">Manage pets</p>
          </button>

          <button
            onClick={() => router.push("/care-plan")}
            className="text-left bg-gradient-to-br from-white to-[#f6faf2] p-5 rounded-2xl border border-[#dbe1d4] shadow-md hover:shadow-lg hover:-translate-y-0.5 transition"
          >
            <p className="text-base text-[#4f5a4c] font-medium">Daily Tasks</p>
            <p className="text-5xl text-[#243022]">
              {stats.tasksToday}
            </p>
            <p className="text-base text-[#4f5a4c] mt-2">Tasks today</p>
          </button>

          <button
            onClick={() => router.push("/calendar")}
            className="text-left bg-gradient-to-br from-white to-[#f6faf2] p-5 rounded-2xl border border-[#dbe1d4] shadow-md hover:shadow-lg hover:-translate-y-0.5 transition"
          >
            <p className="text-base text-[#4f5a4c] font-medium">Appointments</p>
            <p className="text-5xl text-[#243022]">
              {stats.appointmentsUpcoming}
            </p>
            <p className="text-base text-[#4f5a4c] mt-2">Next 7 days</p>
          </button>

          <button
            onClick={() => router.push("/pettrack")}
            className="text-left bg-gradient-to-br from-white to-[#f6faf2] p-5 rounded-2xl border border-[#dbe1d4] shadow-md hover:shadow-lg hover:-translate-y-0.5 transition"
          >
            <p className="text-base text-[#4f5a4c] font-medium">PetTrack Issues</p>
            <p className="text-5xl text-[#243022]">
              {stats.activeIssues}
            </p>
            <p className="text-base text-[#4f5a4c] mt-2">Open issues</p>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <MiniCalendarBox
            month={miniCalendarMonth}
            setMonth={setMiniCalendarMonth}
            appointments={miniCalendarAppointments}
            onOpenCalendar={() => router.push("/calendar")}
          />
          <UpcomingAppointmentsBox
            appointments={miniCalendarAppointments}
            onOpenCalendar={() => router.push("/calendar")}
          />
        </div>
      </div>
    </div>
  );
}

function MiniCalendarBox({ month, setMonth, appointments, onOpenCalendar }) {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];

  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const hasAppointmentOnDay = (day) => {
    return appointments.some((apt) => {
      const dt = new Date(apt.startDate);
      return (
        dt.getFullYear() === month.getFullYear() &&
        dt.getMonth() === month.getMonth() &&
        dt.getDate() === day
      );
    });
  };

  const isTodayDay = (day) => {
    const today = new Date();
    return (
      today.getFullYear() === month.getFullYear() &&
      today.getMonth() === month.getMonth() &&
      today.getDate() === day
    );
  };

  return (
    <div className="w-full bg-gradient-to-br from-white to-[#f7faf3] p-4 rounded-2xl border border-[#dbe1d4] shadow-md lg:col-span-1">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg text-[#4f5a4c]">Calendar</h2>
        <button
          onClick={onOpenCalendar}
          className="text-xs text-[#4f5a4c] font-medium hover:underline"
        >
          Open full calendar
        </button>
      </div>

      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() =>
            setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
          }
          className="px-2 py-1 rounded hover:bg-[#f5f7f3] text-[#697a63]"
        >
          {"<"}
        </button>
        <p className="text-lg text-[#243022]">
          {monthNames[month.getMonth()]} {month.getFullYear()}
        </p>
        <button
          onClick={() =>
            setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
          }
          className="px-2 py-1 rounded hover:bg-[#f5f7f3] text-[#697a63]"
        >
          {">"}
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-[#4f5a4c] mb-1 font-medium">
        {dayNames.map((d, idx) => (
          <div key={`${d}-${idx}`}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => (
          <div
            key={idx}
            className={`h-6 rounded flex items-center justify-center text-[10px] ${
              day === null
                ? "bg-transparent"
                : isTodayDay(day)
                  ? "bg-[#697a63] text-white"
                  : hasAppointmentOnDay(day)
                    ? "bg-[#f5f7f3] text-[#243022] border border-[#697a63]"
                    : "bg-[#f5f7f3] text-[#243022]"
            }`}
          >
            {day ?? ""}
          </div>
        ))}
      </div>
    </div>
  );
}

function UpcomingAppointmentsBox({ appointments, onOpenCalendar }) {
  const upcoming = [...appointments]
    .filter((apt) => new Date(apt.startDate) >= new Date())
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, 6);

  return (
    <div className="bg-gradient-to-br from-white to-[#f7faf3] p-4 rounded-2xl border border-[#dbe1d4] shadow-md lg:col-span-2">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl text-[#243022]">
          Upcoming Appointments
        </h2>
        <button
          onClick={onOpenCalendar}
          className="text-xs text-[#4f5a4c] font-medium hover:underline"
        >
          View all
        </button>
      </div>

      {upcoming.length > 0 ? (
        <div className="space-y-2">
          {upcoming.map((apt) => (
            <div
              key={apt._id}
              className="flex items-center justify-between rounded-lg border border-[#dbe1d4] bg-[#f5f7f3] px-3 py-2 shadow-sm"
            >
              <div className="min-w-0">
                <p className="text-lg text-[#243022] truncate">
                  {apt.title}
                </p>
                <p className="text-sm text-[#4f5a4c] truncate">
                  {apt.petId?.name || "Pet"} -{" "}
                  {new Date(apt.startDate).toLocaleDateString()}
                </p>
              </div>
              <p className="text-sm text-[#4f5a4c] font-medium whitespace-nowrap ml-3">
                {new Date(apt.startDate).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-base text-[#4f5a4c]">No upcoming appointments.</p>
      )}
    </div>
  );
}
