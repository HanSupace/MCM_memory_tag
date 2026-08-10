import type { ExhibitionSeed } from "../types/exhibition";

const notionSource = {
  label: "F.A.M (FASHION & ART at MCM HAUS) Notion",
  url: "https://prism-peach-25c.notion.site/F-A-M-FASHION-ART-at-MCM-HAUS-3b645fedb93480829cc8f1a0e0a6b5f4",
  accessedAt: "2026-08-09",
} as const;

export const exhibitions = [
  {
    id: "exhibition-fam-2022",
    slug: "fam-fashion-art-at-mcm-haus",
    title: "F.A.M: Fashion & Art at MCM HAUS",
    shortTitle: "F.A.M",
    theme: "Rebuild, Remake, Reform — 다시 만들고, 다시 연결하는 패션과 예술",
    summary:
      "MCM의 브랜드 헤리티지와 현대미술을 결합해 익숙한 사물과 공간을 새로운 관점에서 바라보도록 제안한 전시입니다.",
    description:
      "일상의 물건, 오래된 가구, 패션 제품과 예술 작품을 해체하고 재조합해 과거와 미래, 생활과 예술, 패션과 문화가 순환하며 연결되는 모습을 보여줍니다. 최정화의 설치 작품을 중심으로 요하네스 본자이퍼의 혼합매체 오브제, 마티아스 바이셔의 회화와 쾨닉 서울 소속 작가들의 조각 작품이 MCM HAUS 곳곳에 배치됐습니다.",
    nature:
      "2022년 아시아에서 처음 개최된 프리즈 서울을 기념해 마련된 MCM의 연계 특별 프로젝트입니다. 코엑스의 프리즈 서울 본전시가 아니라 프리즈 서울 기간에 청담 MCM HAUS에서 독립적으로 열린 패션·예술 복합 전시입니다.",
    venue: "MCM HAUS 청담",
    address: "서울특별시 강남구 압구정로 412",
    startDate: "2022-08-31",
    endDate: "2022-09-30",
    status: "ended",
    artists: ["최정화", "요하네스 본자이퍼", "마티아스 바이셔"],
    audiences: [
      "패션과 현대미술의 결합에 관심 있는 관람객",
      "프리즈 서울과 서울 아트위크 방문객",
      "일상의 사물을 새로운 관점으로 바라보고 싶은 관람객",
      "브랜드의 문화적 경험과 헤리티지에 관심 있는 MCM 고객",
      "전시 관람과 패션 경험을 함께 즐기는 20~30대 문화·예술 탐색층",
    ],
    tags: [
      "재창조",
      "순환",
      "공존",
      "브랜드 헤리티지",
      "패션과 예술",
      "일상과 오브제",
      "과거와 미래",
    ],
    keyMessage:
      "일상에서 사용되는 평범한 물건도 새로운 관계와 맥락 안에 놓이면 예술로 다시 태어날 수 있습니다. 전시는 단절된 관계를 다시 연결하고 과거의 기억과 현재의 경험을 새로운 미래로 확장합니다.",
    featuredQuote: "생활이 예술이 되고, 예술이 생활이 된다.",
    floorMap: [
      {
        floor: "B1·1F",
        description: "최정화 《Journey to Infinity》를 중심으로 한 F.A.M 메인 전시",
      },
      {
        floor: "1F",
        description: "MCM × 요하네스 본자이퍼 DJ 트렁크",
      },
      {
        floor: "2F",
        description: "MCM AW22 《Rebuild–Remake–Reform》 컬렉션 공간",
      },
    ],
    directionPrinciples: [
      "오래된 사물과 새로운 사물을 병치합니다.",
      "전통 가구와 현대 생활용품을 재조합합니다.",
      "패션 제품과 설치 작품의 경계를 해체합니다.",
      "실내 작품과 도시 풍경을 옥상 조각 전시로 연결합니다.",
      "건물 외관을 디지털 미디어 아트에 활용합니다.",
      "매장 전체를 하나의 확장된 작품으로 활용합니다.",
    ],
    source: notionSource,
  },
] satisfies ExhibitionSeed[];

export { notionSource };
