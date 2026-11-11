import { cn } from '@/lib/utils';
import { InsightTile } from './insight-tile';
import type { TileGroup } from './insights-operations';

/**
 * The headline numbers in two groups: what the chosen period adds up to,
 * and how the board stands right now.
 */
export const InsightTiles = ({ groups }: { groups: TileGroup[] }) => (
  <div className="flex flex-wrap gap-x-5 gap-y-3">
    {groups.map((group, i) => (
      <section
        key={group.caption}
        aria-label={group.caption}
        // the first group holds three tiles, the second two
        className={cn(
          'flex min-w-0 flex-col gap-2',
          i === 0 ? 'grow-3 basis-140' : 'grow-2 basis-90',
        )}
      >
        <h2 className="text-xs font-medium text-ink-subtle">{group.caption}</h2>
        <dl className="flex flex-1 flex-wrap gap-3">
          {group.tiles.map((tile) => (
            <InsightTile key={tile.key} tile={tile} />
          ))}
        </dl>
      </section>
    ))}
  </div>
);
