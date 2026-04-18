import Image from "next/image";

interface PlayerAvatarProps {
  image: string | null;
  name: string;
  frame: string | null;
  size: number;
}

export function PlayerAvatar({ image, name, frame, size }: PlayerAvatarProps) {
  const frameSize = Math.round(size * 1.6);
  const frameOffset = -Math.round((frameSize - size) / 2);
  const borderRadius = size >= 64 ? 16 : 12;

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
        overflow: "visible",
        display: "inline-block",
      }}
    >
      {/* Avatar — clipped to rounded square */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius,
          overflow: "hidden",
        }}
      >
        {image ? (
          <Image
            src={image}
            alt={name}
            width={size}
            height={size}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top",
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              color: "white",
              background: "linear-gradient(135deg, #4285F4, #EA4335)",
              fontSize: Math.round(size * 0.35),
            }}
          >
            {name[0]?.toUpperCase() ?? "?"}
          </div>
        )}
      </div>

      {/* Frame overlay — tràn ra ngoài avatar */}
      {frame && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={frame}
          alt=""
          aria-hidden
          style={{
            position: "absolute",
            width: frameSize,
            height: frameSize,
            top: frameOffset,
            left: frameOffset,
            objectFit: "contain",
            zIndex: 10,
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}
