import Image from "next/image";

interface PlayerAvatarProps {
  image: string | null;
  name: string;
  frame: string | null;
  size: number;
  frameScale?: number;
  frameAnchorX?: number;
  frameAnchorY?: number;
}

export function PlayerAvatar({
  image,
  name,
  frame,
  size,
  frameScale = 1.4,
  frameAnchorX = 0.5,
  frameAnchorY = 0.5,
}: PlayerAvatarProps) {
  const frameSize = Math.round(size * frameScale);
  const frameLeft = Math.round(size / 2 - frameAnchorX * frameSize);
  const frameTop = Math.round(size / 2 - frameAnchorY * frameSize);
  const borderRadius = size >= 64 ? 16 : 12;

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      {/* Avatar — fills container, clipped by border-radius */}
      <div
        style={{
          width: "100%",
          height: "100%",
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

      {/* Frame overlay — DIV với background-image, tránh Tailwind preflight cap <img> width */}
      {frame && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            width: frameSize,
            height: frameSize,
            top: frameTop,
            left: frameLeft,
            backgroundImage: `url(${frame})`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}
