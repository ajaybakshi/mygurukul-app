'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, User, Settings, Bell, Shield, HelpCircle, LogOut, ChevronRight } from 'lucide-react'

export default function ProfilePage() {
  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  // Mock user data
  const user = {
    name: "Spiritual Seeker",
    email: "seeker@example.com",
    joinDate: "January 2024",
    questionsAsked: 12,
    answersReceived: 10,
    memberSince: "3 months"
  }

  const menuItems = [
    {
      icon: Settings,
      title: "Account Settings",
      subtitle: "Manage your profile and preferences",
      href: "#"
    },
    {
      icon: Bell,
      title: "Notifications",
      subtitle: "Control your notification preferences",
      href: "#",
      toggle: notifications,
      onToggle: setNotifications
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      subtitle: "Manage your privacy settings",
      href: "#"
    },
    {
      icon: HelpCircle,
      title: "Help & Support",
      subtitle: "Get help and contact support",
      href: "#"
    }
  ]

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <header className="flex items-center mb-6">
        <Link 
          href="/"
          className="flex items-center text-spiritual-600 hover:text-spiritual-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>
      </header>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-spiritual-950 mb-2">
          Profile
        </h1>
        <p className="text-spiritual-700 mb-8">
          Manage your account and spiritual journey preferences.
        </p>

        {/* User Info Card */}
        <div className="bg-white rounded-xl p-6 card-shadow mb-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 spiritual-gradient rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-spiritual-950 mb-1">
                {user.name}
              </h2>
              <p className="text-spiritual-600 mb-1">{user.email}</p>
              <p className="text-sm text-spiritual-500">Member since {user.memberSince}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-spiritual-50 rounded-lg">
              <div className="text-2xl font-bold text-spiritual-950">{user.questionsAsked}</div>
              <div className="text-sm text-spiritual-600">Questions Asked</div>
            </div>
            <div className="text-center p-4 bg-spiritual-50 rounded-lg">
              <div className="text-2xl font-bold text-spiritual-950">{user.answersReceived}</div>
              <div className="text-sm text-spiritual-600">Answers Received</div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-xl card-shadow overflow-hidden">
          {menuItems.map((item, index) => (
            <div key={index}>
              <div className="flex items-center justify-between p-4 hover:bg-spiritual-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <item.icon className="w-5 h-5 text-spiritual-600" />
                  <div className="flex-1">
                    <h3 className="font-medium text-spiritual-950">{item.title}</h3>
                    <p className="text-sm text-spiritual-600">{item.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {item.toggle !== undefined ? (
                    <button
                      onClick={() => item.onToggle?.(!item.toggle)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        item.toggle ? 'bg-spiritual-500' : 'bg-spiritual-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          item.toggle ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  ) : (
                    <ChevronRight className="w-5 h-5 text-spiritual-400" />
                  )}
                </div>
              </div>
              {index < menuItems.length - 1 && (
                <div className="border-b border-spiritual-100" />
              )}
            </div>
          ))}
        </div>

        {/* Logout */}
        <div className="mt-6">
          <button className="w-full flex items-center justify-center space-x-2 p-4 text-red-600 hover:bg-red-50 rounded-xl transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>

        {/* App Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-spiritual-500">
            MyGurukul v1.0.0
          </p>
          <p className="text-xs text-spiritual-400 mt-1">
            Your spiritual journey companion
          </p>
        </div>
      </div>
    </div>
  )
}

