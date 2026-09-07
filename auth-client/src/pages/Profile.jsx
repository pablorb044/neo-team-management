import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import ProfileField from '../components/profile/ProfileField.jsx'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'

function Profile() {

const { user, logout, updateUser } = useAuth()
const { update, saving, error, success } = useProfile(updateUser)
  const [editing, setEditing] = useState(false)

  const [username, setUsername] = useState(user?.username || '')
  const [email, setEmail] = useState(user?.email || '')
  
  const hasChanges =
  username !== user?.username ||
  email !== user?.email

  const navigate = useNavigate()


  const handleLogout = () => {
    logout()
    navigate('/login')
  }

const handleUpdate = async (e) => {
  e.preventDefault()

  if (!hasChanges || saving) return

  const updated = await update({
    username,
    email
  })

  if (updated) {
    setEditing(false)
  }
}

return (
  <AppLayout>
    <div className="flex min-h-[calc(100vh-8rem)] w-full items-start justify-center">
      <Card className="w-full max-w-xl">
        <div className="mb-8 flex items-center justify-between gap-6">
          <h1 className="text-3xl font-semibold text-white">
            {editing ? 'Edit Profile' : 'Profile Page'}
          </h1>

          {!editing && (
            <Button
              onClick={() => {
                setUsername(user?.username || '')
                setEmail(user?.email || '')
                setEditing(true)
              }}
              className="w-auto px-4 py-2"
            >
              Edit
            </Button>
          )}
        </div>

                  <form
            onSubmit={handleUpdate}
            className="space-y-4"
          >
          {error && (
            <p className="text-sm text-red-400">
              {error}
            </p>
          )}
          
          {editing ? (
            <>
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />

              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </>
          ) : (
            <>
              <ProfileField
                label="Username"
                value={user?.username}
              />

              <ProfileField
                label="Email"
                value={user?.email}
              />
            </>
          )}

          <ProfileField
            label="Role"
            value={user?.role?.toLowerCase()}
          />

          {editing ? (
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setUsername(user?.username || '')
                  setEmail(user?.email || '')
                  setEditing(false)
                }}
                className="w-auto px-4 py-2 bg-white/10 hover:bg-white/20"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={saving || !hasChanges}
                className="w-auto px-4 py-2"
              >
                {saving ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
          ) : (
            <Button onClick={handleLogout}
            className="w-auto px-4 py-2"
            >
              Logout
            </Button>
          )}
        </form>

        {success && (
          <p className="mt-4 text-sm text-emerald-400">
            {success}
          </p>
        )
        }
      </Card>
    </div>
  </AppLayout>
)
}

export default Profile