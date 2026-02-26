"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  PawPrint,
  Heart,
  Calendar,
  Users,
  ShoppingCart,
  Activity,
} from "lucide-react";

export default function Home() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    async function loadUser() {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    }
    loadUser();
  }, []);
  return (
    <div className="min-h-screen bg-[url('https://image2url.com/r2/default/images/1769609070686-bfc2e394-06e7-4c90-a86b-99503392ffe2.png')] w-full lora-font">

      <Navbar />
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl text-[#ccd2c7] mb-6">
              <span className="text-[#f1f3ed]">Pet care</span> Made Easy
            </h1>
            <p className="text-xl text-[#f1f3ed] mb-8">
              Manage your pets' health, schedules, and daily care all in one
              place. Keep your family organized and your pets happy.
            </p>

            {!user && (
              <div className="flex gap-4">
                <Link
                  href="/register"
                  className="bg-[#71836d] text-white px-8 py-3 rounded-4xl hover:bg-[#556053] transition border-2 border-[#71836d]"
                >
                  Sign Up
                </Link>

                <Link
                  href="/login"
                  className="flex items-center gap-2 bg-[#f1f3ed] px-8 py-3 rounded-4xl hover:bg-[#b9bfad] transition border border-[#71836d] border-2 text-[#71836d]"
                >
                  Sign In
                  <svg
                    width="20px"
                    height="20px"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 12H18M18 12L13 7M18 12L13 17"
                      stroke="#71836d"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>

              </div>
            )}
          </div>

          {/* <div className="hidden md:block">
            <div className="bg-white rounded-2xl shadow-2xl p-8 border-4 border-blue-200">
              <PawPrint className="text-blue-600 mb-4" size={48} />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                All Your Pet's Needs
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center gap-2">
                  <Heart size={20} className="text-red-500" />
                  Health & Medical Records
                </li>
                <li className="flex items-center gap-2">
                  <Calendar size={20} className="text-orange-500" />
                  Appointments & Schedules
                </li>
                <li className="flex items-center gap-2">
                  <Activity size={20} className="text-green-500" />
                  Daily Care Tasks
                </li>
                <li className="flex items-center gap-2">
                  <Users size={20} className="text-purple-500" />
                  Family Management
                </li>
              </ul>
            </div>
          </div> */}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-[#fdfdfd] py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-center mb-16 text-[#71836d] text-6xl">
            What We Offer..
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* Feature 1 */}
            <div className="rounded-4xl p-8 hover:shadow-xl transition border-3 border-[#81937d] flex flex-col items-center text-center">
              <PawPrint className="text-[#71836d] mb-4" size={40} />
              <h3 className="text-2xl mb-3">
                Pet Profiles
              </h3>
              <p className="text-gray-700 text-lg">
                Create detailed profiles for each pet with breed, age, medical
                history, and vaccination records.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-4xl p-8 hover:shadow-xl transition border-3 border-[#81937d] flex flex-col items-center text-center">
              <Calendar className="text-[#71836d] mb-4" size={40} />
              <h3 className="text-2xl mb-3">
                Smart Calendar
              </h3>
              <p className="text-gray-700 text-lg">
                View your pet's entire schedule with calendar integration. Never
                miss an appointment.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-4xl p-8 hover:shadow-xl transition border-3 border-[#81937d] flex flex-col items-center text-center">
              <Activity className="text-[#71836d] mb-4" size={40} />
              <h3 className="text-2xl mb-3">
                Care Planning
              </h3>
              <p className="text-gray-700 text-lg">
                Create daily tasks and assign them to family members. Keep
                everyone accountable.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-4xl p-8 hover:shadow-xl transition border-3 border-[#81937d] flex flex-col items-center text-center">
              <Heart className="text-[#71836d] mb-4" size={40} />
              <h3 className="text-2xl mb-3">
                Health Tracking
              </h3>
              <p className="text-gray-700 text-lg">
                Track medications, vaccinations, vet appointments, and health
                records in one place.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-4xl p-8 hover:shadow-xl transition border-3 border-[#81937d] flex flex-col items-center text-center">
              <ShoppingCart className="text-[#71836d] mb-4" size={40} />
              <h3 className="text-2xl mb-3">
                Shopping List
              </h3>
              <p className="text-gray-700 text-lg">
                Keep track of pet food, supplies, toys, and medications you need
                to buy.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-4xl p-8 hover:shadow-xl transition border-3 border-[#81937d] flex flex-col items-center text-center">
              <Users className="text-[#71836d] mb-4" size={40} />
              <h3 className="text-2xl mb-3">
                Family Sharing
              </h3>
              <p className="text-gray-700 text-lg">
                Invite family members to manage your pets together. Assign roles
                and responsibilities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#a8b1a1] text-black py-12">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-2xl mb-6">Ready to Start?</h2>
          <p className="text-lg mb-2">
            Join our league of pet owners who are keeping their pets healthier
            and happier with organized care.
          </p><br />
          <Link
            href="/register"
            className="bg-[#f1f3ed] text-[#262e1d] px-8 py-3 rounded-4xl hover:bg-[#ccd2c7] transition"
          >
            Sign up free today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#81937d] text-black py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-4">
            PetCare © {new Date().getFullYear()}. All rights reserved.
          </p>
          <p>Made with ❤️ by TeamTwo</p>
        </div>
      </footer>
    </div>
  );
}
