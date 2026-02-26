"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit,
  Trash2,
  Loader,
  AlertCircle,
  X,
  Check,
} from "lucide-react";

export default function CarePlanPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [pets, setPets] = useState([]);
  const [members, setMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formData, setFormData] = useState({
    petId: "",
    title: "",
    description: "",
    taskType: "feeding",
    time: "09:00",
    assignedTo: "",
    daysOfWeek: [],
    priority: "medium",
  });

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

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
        setMembers(membersData.members);
        const currentMember = membersData.members.find(
          (m) => m.id.toString() === userData.user.id.toString(),
        );
        setIsOwner(currentMember?.role === "owner");
      }

      const petsResponse = await fetch("/api/pets");
      const petsData = await petsResponse.json();
      setPets(Array.isArray(petsData) ? petsData : []);

      const tasksResponse = await fetch(
        `/api/tasks?date=${selectedDate.toISOString().split("T")[0]}`,
      );
      const tasksData = await tasksResponse.json();
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setTasks([]);
      setPets([]);
      setMembers([]);
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

  const handleDayToggle = (day) => {
    setFormData((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let response;
      if (editingTask) {
        response = await fetch(`/api/tasks/${editingTask._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
      } else {
        response = await fetch("/api/tasks", {
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
        alert(`Error: ${errorData.error || "Failed to save task"}`);
      }
    } catch (error) {
      console.error("Error saving task:", error);
      alert("Error saving task. Please try again.");
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingTask(null);
    setFormData({
      petId: "",
      title: "",
      description: "",
      taskType: "feeding",
      time: "09:00",
      assignedTo: "",
      daysOfWeek: [],
      priority: "medium",
    });
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      petId: task.petId?._id || task.petId,
      title: task.title,
      description: task.description || "",
      taskType: task.taskType,
      time: task.time,
      assignedTo: task.assignedTo?._id || task.assignedTo,
      daysOfWeek: task.daysOfWeek || [],
      priority: task.priority,
    });
    setShowForm(true);
  };

  const handleDelete = async (taskId) => {
    if (!isOwner) {
      alert("Only household owners can delete tasks");
      return;
    }

    if (confirm("Are you sure you want to delete this task?")) {
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          fetchData();
        } else {
          const errorData = await response.json();
          alert(`Error: ${errorData.error || "Failed to delete task"}`);
        }
      } catch (error) {
        console.error("Error deleting task:", error);
      }
    }
  };

  const toggleTaskComplete = async (task) => {
    try {
      const response = await fetch("/api/tasks/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: task._id,
          date: selectedDate.toISOString().split("T")[0],
          isCompleted: !task.isCompleted,
        }),
      });

      if (response.ok) {
        await fetchData();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || "Failed to update task"}`);
      }
    } catch (error) {
      console.error("Error toggling task completion:", error);
    }
  };

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const getTodaysTasks = () => {
    return tasks.sort((a, b) => a.time.localeCompare(b.time));
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9faf7] flex items-center justify-center">
        <Loader className="animate-spin text-[#697a63]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9faf7] p-4 md:p-6">
      <div className="bg-white shadow-md rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-semibold text-[#4f5a4c] tracking-tight py-4">
              Daily Care Plan
            </h1>
            <p className="text-[#9aa59a] mt-1">
              {selectedDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex gap-3">
            <input
              type="date"
              value={selectedDate.toISOString().split("T")[0]}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
            />
            <button
              onClick={() => {
                setEditingTask(null);
                resetForm();
                setShowForm(true);
              }}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              <Plus size={20} />
              Add Task
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-[#4f5a4c] mb-6">
            Today's Schedule
          </h2>
          {getTodaysTasks().length > 0 ? (
            <div className="space-y-0">
              {getTodaysTasks().map((task, index, sortedTasks) => (
                <div key={task._id} className="flex gap-6">
                  <div className="w-24 flex-shrink-0 pt-2">
                    <div className="text-sm font-medium text-gray-900">
                      {formatTime(task.time)}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-0">
                    <button
                      onClick={() => toggleTaskComplete(task)}
                      className="relative z-10 flex items-center justify-center w-6 h-6 cursor-pointer"
                    >
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                          task.isCompleted
                            ? "bg-[#697a63] border-[#697a63]"
                            : "bg-white border-[#697a63]"
                        }`}
                      >
                        {task.isCompleted && (
                          <Check size={14} className="text-white" />
                        )}
                      </div>
                    </button>
                    {index < sortedTasks.length - 1 && (
                      <div className="w-0.5 h-20 bg-[#d4dbce]"></div>
                    )}
                  </div>

                  <div className="flex-1 pb-8">
                    <div
                      className={`p-4 rounded-xl border transition-all ${
                        task.isCompleted
                          ? "bg-[#f2f4ee] border-[#d4dbce]"
                          : "bg-[#f5f7f3] border-[#dbe1d4]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3
                            className={`font-semibold text-lg mb-1 ${
                              task.isCompleted
                                ? "line-through text-gray-500"
                                : "text-[#4f5a4c]"
                            }`}
                          >
                            {task.title}
                          </h3>
                          <p
                            className={`text-sm capitalize mb-3 ${
                              task.isCompleted ? "text-gray-500" : "text-[#697a63]"
                            }`}
                          >
                            {task.taskType}
                          </p>
                          {task.description && (
                            <p className="text-sm text-gray-600 mb-3">
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                              {task.petId?.profileImage ? (
                                <img
                                  src={task.petId.profileImage}
                                  alt={task.petId.name}
                                  className="w-8 h-8 rounded-full object-cover border-2 border-white shadow"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-[#697a63] text-white flex items-center justify-center text-xs font-bold border-2 border-white shadow">
                                  P
                                </div>
                              )}
                              <span className="text-sm font-medium text-gray-700">
                                {task.petId?.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-[#697a63] text-white flex items-center justify-center text-xs font-bold border-2 border-white shadow">
                                {task.assignedTo?.name?.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-medium text-gray-700">
                                {task.assignedTo?.name}
                              </span>
                            </div>

                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                task.priority === "high"
                                  ? "bg-red-100 text-red-700"
                                  : task.priority === "medium"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-green-100 text-green-700"
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(task)}
                            className="p-2 text-[#697a63] hover:bg-[#dbe1d4] rounded-lg transition"
                            title="Edit task"
                          >
                            <Edit size={18} />
                          </button>
                          {isOwner && (
                            <button
                              onClick={() => handleDelete(task._id)}
                              className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition"
                              title="Delete task"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto text-[#9aa59a] mb-2" size={32} />
              <p className="text-gray-500">No tasks scheduled for today</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-[#697a63] hover:text-[#4f5a4c] font-medium"
              >
                Add your first task
              </button>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#4f5a4c]">
                  {editingTask ? "Edit Task" : "Create New Task"}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      Assign To *
                    </label>
                    <select
                      name="assignedTo"
                      value={formData.assignedTo}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                    >
                      <option value="">Select a member</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Task Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="e.g., Morning Walk"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Task Type *
                    </label>
                    <select
                      name="taskType"
                      value={formData.taskType}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                    >
                      <option value="feeding">Feeding</option>
                      <option value="walking">Walking</option>
                      <option value="medication">Medication</option>
                      <option value="grooming">Grooming</option>
                      <option value="play">Play</option>
                      <option value="training">Training</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time *
                    </label>
                    <input
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority *
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Days of Week *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {dayNames.map((day, index) => (
                      <label
                        key={index}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.daysOfWeek.includes(index)}
                          onChange={() => handleDayToggle(index)}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Add any notes..."
                  ></textarea>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-[#697a63] text-white px-6 py-2 rounded-lg hover:bg-[#55624f] transition"
                  >
                    {editingTask ? "Update Task" : "Create Task"}
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
