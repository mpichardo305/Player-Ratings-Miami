// Welcome back
// Awesome you are now joining Group {GroupName} as {PlayerName}
// Show Group Members
// optional do we want to give people option to edit their name? Have to adapt PlayerNameForm to allow editing 

import { FC } from 'react'
import { useGroup } from '../context/GroupContext'
const {currentGroup} = useGroup();

interface Props { onConfirm(): void }
const ReturningPlayerNewGroup: FC<Props> = ({ onConfirm }) => (
  <div className="space-y-4 text-center">
    <p>Welcome back to Player Ratings Miami</p>
    <p>Awesome news that you are now joining a new Group {currentGroup.name}</p>
    <button
      className="px-4 py-2 bg-blue-600 text-white rounded"
      onClick={onConfirm}
    >
      Next
    </button>
  </div>
)

export default ReturningPlayerNewGroup