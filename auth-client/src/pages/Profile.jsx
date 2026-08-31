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
    <div className="flex min-h-[calc(100vh-8rem)] w-full items-center justify-center">
      <Card>
        <div className="mb-6 flex items-center justify-between">
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
              className="w-auto"
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
                className="w-auto bg-white/10 hover:bg-white/20"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={saving || !hasChanges}
                className="w-auto"
              >
                {saving ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
          ) : (
            <Button onClick={handleLogout}>
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