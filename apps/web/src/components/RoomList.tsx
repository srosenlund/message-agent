interface Room {
  id: string;
  name: string;
  lastMessage?: string;
  unreadCount: number;
  timestamp: number;
}

interface Props {
  rooms: Room[];
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
}

export default function RoomList({ rooms, selectedRoomId, onSelectRoom }: Props) {
  return (
    <div className="room-list">
      <h2>Rooms</h2>
      {rooms.length === 0 ? (
        <div className="empty">No rooms yet</div>
      ) : (
        <ul>
          {rooms.map(room => (
            <li
              key={room.id}
              className={selectedRoomId === room.id ? 'selected' : ''}
              onClick={() => onSelectRoom(room.id)}
            >
              <div className="room-name">
                {room.name}
                {room.unreadCount > 0 && (
                  <span className="unread-badge">{room.unreadCount}</span>
                )}
              </div>
              {room.lastMessage && (
                <div className="room-preview">{room.lastMessage}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

