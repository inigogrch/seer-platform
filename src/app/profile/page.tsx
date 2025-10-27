'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Eye, 
  Grid3X3, 
  MessageSquare, 
  Bookmark, 
  User, 
  Settings,
  Bell,
  Shield,
  Download,
  LogOut,
  Edit3,
  Check,
  X,
  Mail,
  Briefcase,
  MapPin,
  Calendar,
  Activity,
  BarChart3,
  Clock,
  Star
} from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: 'Alex Chen',
    email: 'alex.chen@company.com',
    role: 'Product Manager',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    joinedDate: '2024-01-01',
    bio: 'Product Manager focused on AI-powered solutions and user experience optimization. Passionate about emerging technologies and data-driven decision making.'
  })

  const [editData, setEditData] = useState(profileData)

  const handleSave = () => {
    setProfileData(editData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditData(profileData)
    setIsEditing(false)
  }

  const stats = [
    { label: 'Stories Read', value: '247', icon: <BarChart3 className="w-5 h-5" /> },
    { label: 'Stories Saved', value: '32', icon: <Bookmark className="w-5 h-5" /> },
    { label: 'Days Active', value: '45', icon: <Calendar className="w-5 h-5" /> },
    { label: 'Avg. Read Time', value: '6m', icon: <Clock className="w-5 h-5" /> }
  ]

  const preferences = [
    { id: 'email-notifications', label: 'Email Notifications', description: 'Receive daily digest and breaking news alerts', enabled: true },
    { id: 'push-notifications', label: 'Push Notifications', description: 'Get notified about trending stories', enabled: false },
    { id: 'weekly-summary', label: 'Weekly Summary', description: 'Receive a weekly summary of your reading activity', enabled: true },
    { id: 'personalized-recommendations', label: 'Personalized Recommendations', description: 'Get AI-powered story recommendations', enabled: true }
  ]

  const [notificationSettings, setNotificationSettings] = useState<Record<string, boolean>>(
    preferences.reduce((acc, pref) => ({ ...acc, [pref.id]: pref.enabled }), {} as Record<string, boolean>)
  )

  const toggleNotification = (id: string) => {
    setNotificationSettings(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-seer-teal rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900">Seer</span>
            </div>
            <nav className="flex items-center space-x-6">
              <button 
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Grid3X3 className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
              <button 
                onClick={() => router.push('/chat')}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat</span>
              </button>
              <button 
                onClick={() => router.push('/saved')}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Bookmark className="w-4 h-4" />
                <span>Saved Stories</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-seer-teal text-white rounded-lg">
                <User className="w-4 h-4" />
                <span>Profile</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-gradient-to-br from-seer-teal to-seer-teal-hover rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {profileData.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="text-2xl font-bold text-gray-900 bg-transparent border-b border-gray-300 focus:border-seer-teal outline-none"
                    />
                    <input
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className="text-gray-600 bg-transparent border-b border-gray-300 focus:border-seer-teal outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">{profileData.name}</h1>
                    <p className="text-gray-600 mb-2">{profileData.email}</p>
                  </div>
                )}
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Briefcase className="w-4 h-4" />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.role}
                        onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                        className="bg-transparent border-b border-gray-300 focus:border-seer-teal outline-none"
                      />
                    ) : (
                      <span>{profileData.role}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.location}
                        onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                        className="bg-transparent border-b border-gray-300 focus:border-seer-teal outline-none"
                      />
                    ) : (
                      <span>{profileData.location}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {new Date(profileData.joinedDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="flex items-center space-x-2 px-4 py-2 bg-seer-teal text-white rounded-lg hover:bg-seer-teal-hover transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>

          {/* Bio */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">About</h3>
            {isEditing ? (
              <textarea
                value={editData.bio}
                onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                rows={3}
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-seer-teal focus:border-transparent resize-none"
              />
            ) : (
              <p className="text-gray-600 leading-relaxed">{profileData.bio}</p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center mb-2 text-seer-teal">
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Notifications */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-seer-light-teal rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-seer-teal" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
                <p className="text-sm text-gray-600">Manage how you receive updates from Seer</p>
              </div>
            </div>

            <div className="space-y-4">
              {preferences.map((pref) => (
                <div key={pref.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{pref.label}</div>
                    <div className="text-sm text-gray-600">{pref.description}</div>
                  </div>
                  <button
                    onClick={() => toggleNotification(pref.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationSettings[pref.id] ? 'bg-seer-teal' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationSettings[pref.id] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Account Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-seer-light-teal rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-seer-teal" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Account Settings</h2>
                <p className="text-sm text-gray-600">Manage your account and data</p>
              </div>
            </div>

            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <Download className="w-5 h-5 text-gray-600" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Export Data</div>
                    <div className="text-sm text-gray-600">Download your saved stories and reading history</div>
                  </div>
                </div>
                <div className="text-gray-400">→</div>
              </button>

              <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-gray-600" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Privacy Settings</div>
                    <div className="text-sm text-gray-600">Manage your data privacy and sharing preferences</div>
                  </div>
                </div>
                <div className="text-gray-400">→</div>
              </button>

              <button className="w-full flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <LogOut className="w-5 h-5 text-red-600" />
                  <div className="text-left">
                    <div className="font-medium text-red-900">Sign Out</div>
                    <div className="text-sm text-red-600">Sign out of your Seer account</div>
                  </div>
                </div>
                <div className="text-red-400">→</div>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
