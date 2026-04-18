import Image from "next/image";

interface PlayerAvatarProps {
  image: string | null;
  name: string;
  frame: string | null;
  size: number;
}

export function PlayerAvatar({ image, name, frame, size }: PlayerAvatarProps) {
  const frameSize = Math.round(size * 1.6);
  const frameOffset = -Math.round(size * 0.2);
  const borderRadius = size >= 64 ? 16 : 12;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      {/* Avatar inner — clipped */}
      <div
        className="w-full h-full overflow-hidden"
        style={{ borderRadius }}
      >
        {image ? (
          <Image
            src={image}
            alt={name}
            width={size}
            height={size}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center font-bold text-white"
            style={{
              background: "linear-gradient(135deg, #4285F4, #EA4335)",
              fontSize: Math.round(size * 0.35),
            }}
          >
            {name[0]?.toUpperCase() ?? "?"}
          </div>
        )}
      </div>

      {/* Frame overlay — tràn ra ngoài, căn giữa avatar */}
      {frame && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={frame}
          alt=""
          aria-hidden
          className="absolute pointer-events-none select-none"
          style={{
            width: frameSize,
            height: frameSize,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            objectFit: "contain",
            zIndex: 10,
          }}
        />
      )}
    </div>
  );
}
