import type { ExhibitionSeed } from "../types/exhibition";

const notionSource = {
  label: "F.A.M (FASHION & ART at MCM HAUS) Notion",
  url: "https://prism-peach-25c.notion.site/F-A-M-FASHION-ART-at-MCM-HAUS-3b645fedb93480829cc8f1a0e0a6b5f4",
  accessedAt: "2026-08-09",
} as const;

const wearableCasaSource = {
  label: "MCM Wearable Casa 카탈로그 및 Fuorisalone 2024",
  url: "https://www.fuorisalone.it/en/2024/events/4130/MCM-Wearable-Casa-Collection-by-Atelier-Biagetti",
  accessedAt: "2026-08-14",
} as const;

const berbrickWonderlandSource = {
  label: "BE@RBRICK in MCM Wonderland 기획 문서 및 MCM 공식 전시 자료",
  url: "https://jp.mcmworldwide.com/en_JP/frieze25-edit",
  accessedAt: "2026-08-15",
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
  {
    id: "exhibition-wearable-casa-2024",
    slug: "mcm-wearable-casa-2024",
    title: "MCM 웨어러블 카사 컬렉션",
    shortTitle: "웨어러블 카사",
    theme: "입을 수 있는 집 — 이동하는 삶을 위한 새로운 패션과 리빙",
    summary:
      "언제 어디서나 이동하고 착용할 수 있는 이중 용도 오브제를 통해 디지털 노마드 시대의 집과 가구를 새롭게 해석한 전시입니다.",
    description:
      "Atelier Biagetti는 익숙한 오브제와 소중한 물건이 곁에 있으면 어디든 집처럼 느낄 수 있다는 생각에서 집을 개인화된 몰입형 경험으로 정의합니다. 바우하우스의 기능성과 현대 디지털 노마드의 생활방식을 결합한 일곱 개의 아이템 및 작품군은 가구, 패션과 이동 장비의 경계를 넘나듭니다. 실물 전시와 Vitruvio Virtual Reality가 제작에 협력한 메타버스 공간을 함께 제공해 현실과 가상에서 동일한 개념을 탐험하게 합니다.",
    nature:
      "MCM HAUS의 실물 공간과 메타버스를 결합한 하이브리드 전시입니다. 원격 관람객도 가상 환경을 탐험하고 MCM 의상을 착용하며 기능, 재질과 크기가 변하는 오브제와 상호작용할 수 있습니다.",
    venue: "MCM HAUS 플래그십 스토어",
    address: "서울특별시 강남구 압구정로 412",
    startDate: "2024-09-03",
    endDate: "2024-10-06",
    operatingHours: "매일 11:00–20:00",
    status: "ended",
    artists: ["Atelier Biagetti", "알베르토 비아게티", "로라 발다사리"],
    audiences: [
      "공간의 제약 없이 이동하며 생활하고 근무하는 디지털 노마드",
      "패션과 가구의 경계를 넘는 다기능 디자인에 관심 있는 관람객",
      "메타버스와 실물 공간을 결합한 전시 경험을 원하는 관람객",
      "지속 가능한 이동형 생활방식을 탐색하는 관람객",
    ],
    tags: [
      "디지털 노마드",
      "입을 수 있는 집",
      "다기능 오브제",
      "바우하우스",
      "패션과 리빙",
      "메타버스",
      "하이브리드 전시",
    ],
    keyMessage:
      "집은 고정된 물리적 장소가 아니라 사람과 함께 이동하는 오브제, 기억과 경험으로 만들어질 수 있습니다. 하나의 물건이 착용과 거주라는 두 역할을 오가며 이동하는 삶에도 안락함과 개성을 제공합니다.",
    featuredQuote: "사물은 전통적인 역할을 넘어 다기능적이고 변형 가능한 존재가 됩니다.",
    floorMap: [
      {
        floor: "5F",
        description: "Mindteaser Chair·Cube·Stool, Wearable Casa 메타버스 영상과 MCM FW 시즌 컬렉션",
      },
      {
        floor: "3F",
        description: "Chatty Sofa, Tatamu와 Clepsydra Lantern으로 구성된 메인 리빙 공간",
      },
      {
        floor: "1F",
        description: "Space Cabinet·Planet 시리즈, Magic Gilet, Pet Backpack과 MCM Diamant 3D 및 FW 컬렉션",
      },
    ],
    directionPrinciples: [
      "하나의 오브제에 착용과 거주 또는 수납과 가구라는 두 가지 용도를 결합합니다.",
      "바우하우스의 기능성과 현대 디지털 노마드의 이동성을 연결합니다.",
      "익숙하고 소중한 물건을 통해 장소와 무관하게 집 같은 감각을 만듭니다.",
      "실물 오브제와 메타버스 속 변형 가능한 오브제를 하나의 경험으로 구성합니다.",
      "사람뿐 아니라 반려동물과 디지털 기기까지 이동형 생활공간의 구성원으로 포함합니다.",
    ],
    source: wearableCasaSource,
  },
  {
    id: "exhibition-berbrick-wonderland-2025",
    slug: "berbrick-in-mcm-wonderland-2025",
    title: "BE@RBRICK in MCM Wonderland",
    shortTitle: "BE@RBRICK Wonderland",
    theme: "예술·패션·팝 컬처와 일본 장인정신이 만나는 MCM의 원더랜드",
    summary:
      "동일한 BE@RBRICK 형태가 서로 다른 재료와 기법, 기억을 만나 완전히 다른 정체성을 얻는 과정을 층별 몰입형 공간으로 보여주는 전시입니다.",
    description:
      "프리즈 서울 2025 기간에 맞춰 MCM HAUS 전체를 하나의 원더랜드로 바꾼 MCM 최초의 BE@RBRICK 특화 전시입니다. 노부키 히즈메의 오트 쿠튀르 모자, 켄 야시키의 가족 기억이 담긴 직물과 키메코미 기법, 인덴야의 400년 고슈 인덴 공예가 BE@RBRICK이라는 공통 형식 위에서 만납니다. 여기에 MCM, MEDICOM TOY, Karimoku가 참여한 한정 컬렉터 제품을 더해 예술 작품과 패션 상품, 전통 공예와 팝 아이콘 사이의 경계를 확장합니다.",
    nature:
      "작가별 설치 작품, 일본 장인 공예, 컬렉터 제품과 캡슐 컬렉션을 층마다 독립적인 세계로 구성한 몰입형 복합 전시입니다. MCM과 MEDICOM TOY가 2021년부터 이어 온 협업의 다섯 번째 프로젝트이자 MCM의 첫 BE@RBRICK 중심 전시입니다.",
    venue: "MCM HAUS 플래그십 스토어",
    address: "서울특별시 강남구 압구정로 412",
    startDate: "2025-09-03",
    endDate: "2025-09-30",
    operatingHours: "매일 11:00–20:00",
    status: "ended",
    artists: [
      "노부키 히즈메",
      "켄 야시키",
      "INDEN-YA",
      "Karimoku",
      "MCM",
      "MEDICOM TOY",
    ],
    audiences: [
      "BE@RBRICK과 아트 토이를 수집하는 컬렉터",
      "패션과 현대미술의 교차점에 관심 있는 관람객",
      "프리즈 서울과 서울 아트 위크를 찾은 방문객",
      "일본 전통 공예와 현대 디자인에 관심 있는 관람객",
      "MCM의 문화·예술 프로젝트와 한정 컬렉션을 경험하려는 고객",
    ],
    tags: [
      "BE@RBRICK",
      "프리즈 서울 2025",
      "일본 장인정신",
      "오트 쿠튀르",
      "키메코미",
      "고슈 인덴",
      "팝 컬처",
      "컬렉터 아트",
    ],
    keyMessage:
      "같은 형태도 어떤 재료와 기술, 기억을 품는지에 따라 전혀 다른 존재가 됩니다. BE@RBRICK은 장인의 기술과 개인의 이야기를 새로운 세대에 전달하는 문화적 플랫폼으로 확장됩니다.",
    featuredQuote:
      "하나의 형태에 서로 다른 세계가 담기고, 그 차이가 모여 새로운 풍경을 만듭니다.",
    floorMap: [
      {
        floor: "ROOFTOP",
        description: "도시 풍경과 대형 BE@RBRICK을 연결한 랜드마크형 포토존",
      },
      {
        floor: "5F",
        description: "새벽의 신비로운 숲 속 INDEN-YA 400%·1000% 작품과 고슈 인덴 시연",
      },
      {
        floor: "3F",
        description: "COSMOS IN BLOOM 정원 속 켄 야시키 1000% BE@RBRICK과 〈PAUSE–Usa Usa〉",
      },
      {
        floor: "1F",
        description: "노부키 히즈메의 오트 쿠튀르 모자 설치, 미러룸과 한정 캡슐 컬렉션",
      },
    ],
    directionPrinciples: [
      "참여 작가의 개별 세계를 하나의 스타일로 통일하지 않고 층별 독립 공간으로 보존합니다.",
      "서로 다른 문화와 신념을 존중하면서 동일한 BE@RBRICK 형식 안에서 대화하게 합니다.",
      "전통 공예의 손기술과 현대 팝 컬처의 대중성을 결합합니다.",
      "오래된 기술이 새로운 시장과 세대에 도달하는 방식을 보여줍니다.",
      "예술 작품, 패션 제품과 컬렉터 아이템 사이의 경계를 확장합니다.",
      "재료와 제작 과정이 만든 차이를 가까이 관찰할 수 있도록 공간을 구성합니다.",
    ],
    source: berbrickWonderlandSource,
  },
] satisfies ExhibitionSeed[];

export { berbrickWonderlandSource, notionSource, wearableCasaSource };
