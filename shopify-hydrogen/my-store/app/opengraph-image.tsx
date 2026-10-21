import {ImageResponse} from "next/og";

export const alt =
  "Velvet Journal Co — journals and planners for intentional living";
export const size = {width: 1200, height: 630};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#f4ede7",
          color: "#4a3a35",
        }}
      >
        <div
          style={{
            fontSize: 26,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            marginBottom: 28,
          }}
        >
          Velvet Journal Co
        </div>

        <div
          style={{
            fontSize: 72,
            lineHeight: 1.02,
            maxWidth: 950,
            fontWeight: 700,
          }}
        >
          Journals for gratitude, goals, wellness & intentional living.
        </div>

        <div
          style={{
            fontSize: 28,
            marginTop: 34,
            opacity: 0.75,
          }}
        >
          velvetjournalco.store
        </div>
      </div>
    ),
    size,
  );
}
