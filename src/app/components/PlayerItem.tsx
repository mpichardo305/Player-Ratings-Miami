// /components/PlayerItem.tsx
type Player = {
  id: number;
  name: string;
  avg_rating: number;
  ratings: { rating: number; player_id: number }[];
};

type PlayerItemProps = {
  player: Player;
  onRate: (playerId: number, rating: number) => void;
};

export default function PlayerItem({ player, onRate }: PlayerItemProps) {
  return (
    <div className="flex flex-col items-center bg-gray-700 p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-white">{player.name}</h3>
      <div className="flex space-x-1 mt-2">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => onRate(player.id, star)}
            className={`text-2xl ${star <= player.avg_rating ? "text-yellow-400" : "text-gray-500"} hover:scale-110 transition-transform`}
          >
            ★
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-400 mt-2">Average Rating: {player.avg_rating}</p>
    </div>
  );
}