import { ImageResponse } from "@vercel/og";
import type { NextRequest } from "next/server";

export const config = {
  runtime: "edge",
};

// Fetch Sixtyfour font
const sixtyfourFontPromise = fetch(
  new URL("https://fonts.gstatic.com/s/sixtyfour/v1/CKaU2p-E6CowrB8TXLLUgcJLxH3t4a1v.woff2"),
).then((res) => res.arrayBuffer());

// Fetch Inter font for subtitles
const interFontPromise = fetch(
  new URL(
    "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiJ-Ek-_EeA.woff2",
  ),
).then((res) => res.arrayBuffer());

export default async function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Parameters
    const title = searchParams.get("title");
    const subtitle = searchParams.get("subtitle");
    const image = searchParams.get("image");
    const type = searchParams.get("type") || "default"; // default, article, project

    // Load fonts
    const [sixtyfourFont, interFont] = await Promise.all([sixtyfourFontPromise, interFontPromise]);

    // If it's an article with an image, show that with nice styling
    if (type === "article" && image) {
      return new ImageResponse(
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#000",
            position: "relative",
          }}
        >
          {/* Background image with overlay */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
            }}
          >
            <img
              src={image}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: 0.4,
              }}
            />
          </div>

          {/* Gradient overlay */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 100%)",
            }}
          />

          {/* Content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "60px",
              textAlign: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Logo and branding */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "40px",
                gap: "16px",
              }}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 1024 1024"
                style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))" }}
              >
                <g transform="matrix(2.059211,0,0,2.059211,-553.177632,-525.519737)">
                  <path
                    d="M615,544C615,544 613.521,533.902 594,523C577.112,513.569 570.175,518.633 572,494C574.342,462.378 576,437 576,437"
                    style={{ fill: "none", stroke: "white", strokeWidth: "17.48px" }}
                  />
                  <path
                    d="M576,437C576,437 578.338,385.169 614,388C649.902,390.85 667.101,413.01 670,417C672.899,420.99 704.841,456.16 703,507C701.737,541.873 701,526 701,526"
                    style={{ fill: "none", stroke: "white", strokeWidth: "17.48px" }}
                  />
                  <path
                    d="M471,285L449,289L422,299L397,319L388,329L358,363C353.627,369.411 355.426,370.873 354,379L353,394L349,411L343,425L335,440L319,460L312,472C313.364,496.934 311.998,487.285 312,485L315,498L319,509L323,514L316,527L312,535L308,544L307,553L319,559L328,562L337,567L342,574L348,589L351,600L354,612L355,622L344,620L335,622L330,630L332,640L334,653L333,665L331,677L327,688L321,695L315,706L314,714L317,724L325,729C325,729 340.523,731.681 340,730C339.477,728.319 353.029,727.036 362,731L374,733L390,734L407,735L427,734L454,731L483,726L507,717L524,708L533,700L540.029,693.569L548,684L566,686L587,681L608,672L639,657L664,640L691,613L707,588L718,569L728,541L736,505L737,488L737,468L734,444L725,422L711,403L690,380L661,351L625,320L593,296L564,284L547,280L528,279L511,280L492,282L471,285Z"
                    style={{ fill: "none", stroke: "white", strokeWidth: "17.48px" }}
                  />
                  <path
                    d="M493,384L486.443,385.093L478,387L470,392L460,404L456,416L454,427C454,427 455.545,437.727 459,445C462.455,452.273 472,457 472,457L482,461L501,467C501,467 511.342,468.529 517,466C522.658,463.471 529,458 529,458L539,444L544,424L539,405L528,395L518,390L506,385L493,384Z"
                    style={{ fill: "none", stroke: "white", strokeWidth: "17.48px" }}
                  />
                  <path
                    d="M422,397C422,397 382.186,461.643 386,469C389.814,476.357 391.987,474.922 391.987,474.922C391.987,474.922 378.438,463.644 390.322,473.696C402.364,483.88 424.203,470.422 425,469L422,397Z"
                    style={{ fill: "none", stroke: "white", strokeWidth: "17.48px" }}
                  />
                  <g>
                    <path
                      d="M355,427C359.812,398.45 364.407,388.181 377,380C389.593,371.819 391,376 391,376L400,378C416.311,385.08 422.614,390.797 422,397"
                      style={{ fill: "none", stroke: "white", strokeWidth: "17.48px" }}
                    />
                    <path
                      d="M355,427C355,427 354.103,437.039 359,447C363.897,456.961 395.165,444.066 398,438"
                      style={{ fill: "none", stroke: "white", strokeWidth: "17.48px" }}
                    />
                  </g>
                  <path
                    d="M493,589C493,589 491.158,534.079 516,563C540.842,591.921 540.125,594.975 577,561C587.853,551.001 588,578 588,578C588,578 590.679,587.752 564,637C558.639,646.896 548,684 548,684"
                    style={{ fill: "none", stroke: "white", strokeWidth: "17.48px" }}
                  />
                  <path
                    d="M448,493C448,493 462.431,533.988 493,524"
                    style={{ fill: "none", stroke: "white", strokeWidth: "17.48px" }}
                  />
                  <path
                    d="M497,524C497,524 525.773,515.332 539,534"
                    style={{ fill: "none", stroke: "white", strokeWidth: "17.48px" }}
                  />
                </g>
              </svg>
              <span
                style={{
                  fontFamily: "Sixtyfour",
                  fontSize: "32px",
                  color: "white",
                  letterSpacing: "-1px",
                }}
              >
                nevulo
              </span>
            </div>

            {/* Title */}
            <h1
              style={{
                fontFamily: "Inter",
                fontSize: title && title.length > 40 ? "48px" : "56px",
                fontWeight: "700",
                color: "white",
                margin: 0,
                marginBottom: subtitle ? "16px" : "0",
                textShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
                lineHeight: 1.2,
                maxWidth: "900px",
              }}
            >
              {title || "Nevulo"}
            </h1>

            {/* Subtitle */}
            {subtitle && (
              <p
                style={{
                  fontFamily: "Inter",
                  fontSize: "24px",
                  color: "rgba(255, 255, 255, 0.8)",
                  margin: 0,
                  maxWidth: "700px",
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>,
        {
          width: 1200,
          height: 630,
          fonts: [
            { name: "Sixtyfour", data: sixtyfourFont, style: "normal", weight: 400 },
            { name: "Inter", data: interFont, style: "normal", weight: 700 },
          ],
        },
      );
    }

    // Default OG image - clean black background with nevulo branding
    return new ImageResponse(
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#000",
          position: "relative",
        }}
      >
        {/* Subtle gradient overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(circle at 50% 50%, rgba(79, 77, 193, 0.15) 0%, transparent 70%)",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Skull logo */}
          <svg
            width="160"
            height="160"
            viewBox="0 0 1024 1024"
            style={{
              marginBottom: "40px",
              filter: "drop-shadow(0 8px 24px rgba(79, 77, 193, 0.4))",
            }}
          >
            <g transform="matrix(2.059211,0,0,2.059211,-553.177632,-525.519737)">
              <path
                d="M615,544C615,544 613.521,533.902 594,523C577.112,513.569 570.175,518.633 572,494C574.342,462.378 576,437 576,437"
                style={{ fill: "none", stroke: "white", strokeWidth: "17.48px" }}
              />
              <path
                d="M576,437C576,437 578.338,385.169 614,388C649.902,390.85 667.101,413.01 670,417C672.899,420.99 704.841,456.16 703,507C701.737,541.873 701,526 701,526"
                style={{ fill: "none", stroke: "white", strokeWidth: "17.48px" }}
              />
              <path
                d="M471,285L449,289L422,299L397,319L388,329L358,363C353.627,369.411 355.426,370.873 354,379L353,394L349,411L343,425L335,440L319,460L312,472C313.364,496.934 311.998,487.285 312,485L315,498L319,509L323,514L316,527L312,535L308,544L307,553L319,559L328,562L337,567L342,574L348,589L351,600L354,612L355,622L344,620L335,622L330,630L332,640L334,653L333,665L331,677L327,688L321,695L315,706L314,714L317,724L325,729C325,729 340.523,731.681 340,730C339.477,728.319 353.029,727.036 362,731L374,733L390,734L407,735L427,734L454,731L483,726L507,717L524,708L533,700L540.029,693.569L548,684L566,686L587,681L608,672L639,657L664,640L691,613L707,588L718,569L728,541L736,505L737,488L737,468L734,444L725,422L711,403L690,380L661,351L625,320L593,296L564,284L547,280L528,279L511,280L492,282L471,285Z"
                style={{ fill: "none", stroke: "white", strokeWidth: "17.48px" }}
              />
              <path
                d="M493,384L486.443,385.093L478,387L470,392L460,404L456,416L454,427C454,427 455.545,437.727 459,445C462.455,452.273 472,457 472,457L482,461L501,467C501,467 511.342,468.529 517,466C522.658,463.471 529,458 529,458L539,444L544,424L539,405L528,395L518,390L506,385L493,384Z"
                style={{ fill: "none", stroke: "white", strokeWidth: "17.48px" }}
              />
              <path
                d="M422,397C422,397 382.186,461.643 386,469C389.814,476.357 391.987,474.922 391.987,474.922C391.987,474.922 378.438,463.644 390.322,473.696C402.364,483.88 424.203,470.422 425,469L422,397Z"
                style={{ fill: "none", stroke: "white", strokeWidth: "17.48px" }}
              />
              <g>
                <path
                  d="M355,427C359.812,398.45 364.407,388.181 377,380C389.593,371.819 391,376 391,376L400,378C416.311,385.08 422.614,390.797 422,397"
                  style={{ fill: "none", stroke: "white", strokeWidth: "17.48px" }}
                />
                <path
                  d="M355,427C355,427 354.103,437.039 359,447C363.897,456.961 395.165,444.066 398,438"
                  style={{ fill: "none", stroke: "white", strokeWidth: "17.48px" }}
                />
              </g>
              <path
                d="M493,589C493,589 491.158,534.079 516,563C540.842,591.921 540.125,594.975 577,561C587.853,551.001 588,578 588,578C588,578 590.679,587.752 564,637C558.639,646.896 548,684 548,684"
                style={{ fill: "none", stroke: "white", strokeWidth: "17.48px" }}
              />
              <path
                d="M448,493C448,493 462.431,533.988 493,524"
                style={{ fill: "none", stroke: "white", strokeWidth: "17.48px" }}
              />
              <path
                d="M497,524C497,524 525.773,515.332 539,534"
                style={{ fill: "none", stroke: "white", strokeWidth: "17.48px" }}
              />
            </g>
          </svg>

          {/* Title */}
          <h1
            style={{
              fontFamily: "Sixtyfour",
              fontSize: title ? "64px" : "80px",
              fontWeight: "400",
              color: "white",
              margin: 0,
              marginBottom: title ? "20px" : "0",
              letterSpacing: "-2px",
              textShadow: "0 4px 24px rgba(79, 77, 193, 0.5)",
            }}
          >
            {title || "nevulo"}
          </h1>

          {/* Subtitle */}
          {subtitle && (
            <p
              style={{
                fontFamily: "Inter",
                fontSize: "28px",
                color: "rgba(255, 255, 255, 0.7)",
                margin: 0,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
        fonts: [
          { name: "Sixtyfour", data: sixtyfourFont, style: "normal", weight: 400 },
          { name: "Inter", data: interFont, style: "normal", weight: 700 },
        ],
      },
    );
  } catch (e) {
    console.log(`${e instanceof Error ? e.message : "Unknown error"}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
