export type DocentQuestionCategory = "작품 이해" | "감상 포인트" | "재료와 제작" | "전시 맥락" | "비하인드";

export type DocentQuestionPreset = {
  category: DocentQuestionCategory;
  question: string;
};

const commonQuestions = (title: string): DocentQuestionPreset[] => [
  { category: "작품 이해", question: `${title}을 처음 보는 사람에게 쉽게 설명해 주세요.` },
  { category: "작품 이해", question: `이 작품의 제목에는 어떤 의미가 담겨 있나요?` },
  { category: "작품 이해", question: `작가는 이 작품을 통해 어떤 이야기를 전하려 했나요?` },
  { category: "감상 포인트", question: `이 작품을 볼 때 가장 먼저 주목할 부분은 어디인가요?` },
  { category: "감상 포인트", question: `가까이에서 볼 때와 멀리서 볼 때 무엇이 다르게 보이나요?` },
  { category: "재료와 제작", question: `이 작품에는 어떤 재료와 제작 방식이 사용됐나요?` },
  { category: "전시 맥락", question: `이 작품은 전시의 전체 주제와 어떻게 연결되나요?` },
  { category: "전시 맥락", question: `작품이 지금 위치에 설치된 이유가 있나요?` },
  { category: "비하인드", question: `이 작품에 관해 알아두면 좋은 비하인드 이야기가 있나요?` },
];

const exhibitionQuestions: Record<string, DocentQuestionPreset[]> = {
  "exhibition-fam-2022": [
    { category: "전시 맥락", question: "F.A.M 전시가 말하는 Rebuild, Remake, Reform은 무엇인가요?" },
    { category: "전시 맥락", question: "이 전시에서는 패션과 현대미술이 어떤 방식으로 만나나요?" },
    { category: "전시 맥락", question: "평범한 생활용품이 예술 작품으로 바뀌는 과정이 궁금해요." },
    { category: "전시 맥락", question: "F.A.M 전시와 프리즈 서울은 어떤 관계가 있나요?" },
    { category: "감상 포인트", question: "이 전시에서 과거와 현재가 함께 보이는 부분은 어디인가요?" },
  ],
  "exhibition-wearable-casa-2024": [
    { category: "전시 맥락", question: "웨어러블 카사에서 말하는 ‘입을 수 있는 집’은 무슨 뜻인가요?" },
    { category: "전시 맥락", question: "이 작품은 디지털 노마드의 생활과 어떻게 연결되나요?" },
    { category: "전시 맥락", question: "바우하우스의 기능성이 이 컬렉션에 어떻게 반영됐나요?" },
    { category: "전시 맥락", question: "실물 전시와 메타버스는 어떤 방식으로 이어지나요?" },
    { category: "감상 포인트", question: "이 작품이 가진 두 가지 용도를 각각 알려 주세요." },
  ],
  "exhibition-berbrick-wonderland-2025": [
    { category: "전시 맥락", question: "같은 BE@RBRICK 형태가 작품마다 다르게 느껴지는 이유는 무엇인가요?" },
    { category: "전시 맥락", question: "이 전시에서 일본 장인정신과 팝 컬처는 어떻게 만나나요?" },
    { category: "전시 맥락", question: "BE@RBRICK이 단순한 장난감을 넘어 예술이 되는 지점은 어디인가요?" },
    { category: "전시 맥락", question: "MCM과 MEDICOM TOY의 협업은 이번 전시에서 어떤 의미가 있나요?" },
    { category: "감상 포인트", question: "작품별 재료와 표면의 차이를 어떻게 비교해서 보면 좋을까요?" },
  ],
};

const artworkQuestions: Record<string, DocentQuestionPreset[]> = {
  "artwork-fam-infinity": [
    { category: "작품 이해", question: "왜 밥그릇으로 무한의 형태를 만들었나요?" },
    { category: "작품 이해", question: "각각의 그릇은 사람과 공동체를 어떻게 상징하나요?" },
    { category: "감상 포인트", question: "뫼비우스의 띠와 이 작품은 어떤 점이 닮았나요?" },
    { category: "재료와 제작", question: "서로 다른 그릇을 하나의 구조로 연결한 방식이 궁금해요." },
    { category: "비하인드", question: "설치 장소가 바뀌면 작품의 모습과 의미도 달라지나요?" },
  ],
  "artwork-fam-muimui": [
    { category: "작품 이해", question: "무이무이라는 제목은 무슨 뜻인가요?" },
    { category: "작품 이해", question: "오래된 가구와 플라스틱 생활용품을 함께 놓은 이유는 무엇인가요?" },
    { category: "감상 포인트", question: "낡은 표면과 사용 흔적도 작품의 일부인가요?" },
    { category: "비하인드", question: "최정화 작가는 작품에 사용한 물건들을 어디에서 모았나요?" },
    { category: "비하인드", question: "작가가 수집한 사물을 ‘사부님’이라고 부르는 이유는 무엇인가요?" },
  ],
  "artwork-fam-giyeok-moment": [
    { category: "작품 이해", question: "제목에서 한글 자음 ‘ㄱ’은 무엇을 상징하나요?" },
    { category: "작품 이해", question: "오래된 쟁기와 현대적인 네온을 결합한 이유는 무엇인가요?" },
    { category: "감상 포인트", question: "네온이 켜졌을 때와 꺼졌을 때 어떻게 다르게 감상하면 좋나요?" },
    { category: "전시 맥락", question: "계단 근처라는 설치 위치가 작품의 의미와 관련이 있나요?" },
    { category: "비하인드", question: "작품에 사용된 쟁기는 어디에서 발견된 물건인가요?" },
  ],
  "artwork-fam-dj-trunk": [
    { category: "작품 이해", question: "DJ 트렁크는 가방이면서 어떻게 예술 작품이 되나요?" },
    { category: "작품 이해", question: "이 작품과 유럽의 분더캄머는 어떤 관계가 있나요?" },
    { category: "감상 포인트", question: "트렁크 안에서 MCM의 역사와 작가의 개인적 기억을 어떻게 구분할 수 있나요?" },
    { category: "비하인드", question: "트렁크 속 기린 오브제에는 어떤 사연이 있나요?" },
    { category: "비하인드", question: "이 작품이 베를린에서 서울로 이동한 사실도 작품의 일부인가요?" },
  ],
  "artwork-wearable-casa-chatty-sofa": [
    { category: "작품 이해", question: "소파의 형태가 ‘CASA’라는 글자를 어떻게 보여주나요?" },
    { category: "작품 이해", question: "Chatty Sofa가 대화와 연결의 공간인 이유는 무엇인가요?" },
    { category: "재료와 제작", question: "테디 원단과 부드러운 형태를 사용한 이유가 있나요?" },
    { category: "비하인드", question: "1970년대 Bocca Sofa에서 어떤 영감을 받았나요?" },
    { category: "감상 포인트", question: "기기 연결과 충전 기능도 작품의 의미에 포함되나요?" },
  ],
  "artwork-wearable-casa-tatamu": [
    { category: "작품 이해", question: "Tatamu라는 이름은 어떤 뜻인가요?" },
    { category: "작품 이해", question: "하나의 매트가 어떤 가구 형태들로 변할 수 있나요?" },
    { category: "재료와 제작", question: "매트를 접고 펼치는 구조는 어떻게 작동하나요?" },
    { category: "감상 포인트", question: "노랑, 빨강, 파랑 색상은 바우하우스와 어떤 관련이 있나요?" },
    { category: "비하인드", question: "Eileen Gray의 데이베드에서 어떤 영향을 받았나요?" },
  ],
  "artwork-wearable-casa-clepsydra": [
    { category: "작품 이해", question: "Clepsydra라는 이름과 모래시계 형태는 어떤 관계인가요?" },
    { category: "작품 이해", question: "램프 갓을 모자로 착용할 수 있게 만든 이유는 무엇인가요?" },
    { category: "재료와 제작", question: "가죽, 알루미늄과 라탄은 작품에서 어떻게 결합되나요?" },
    { category: "감상 포인트", question: "조명과 패션 액세서리라는 두 기능을 어떻게 비교해 보면 좋나요?" },
    { category: "전시 맥락", question: "휴대용 충전식 조명이 이동하는 집이라는 주제와 어떻게 연결되나요?" },
  ],
  "artwork-wearable-casa-planet-small": [
    { category: "작품 이해", question: "Planet Small은 행성 형태이면서 어떤 용도로 사용할 수 있나요?" },
    { category: "작품 이해", question: "거울이 있는 주얼리 미니백이라는 기능에는 어떤 의미가 있나요?" },
    { category: "감상 포인트", question: "구형 몸체와 긴 스트랩을 함께 보면 어떤 인상이 생기나요?" },
    { category: "전시 맥락", question: "우주 탐험이라는 영감이 이동하는 삶과 어떻게 연결되나요?" },
    { category: "재료와 제작", question: "MCM 비세토스 패턴은 이 오브제의 정체성을 어떻게 보여주나요?" },
  ],
  "artwork-wearable-casa-planet-medium": [
    { category: "작품 이해", question: "Planet Medium은 조명인가요, 수납 가구인가요?" },
    { category: "작품 이해", question: "구형 미니 캐비닛에 후광 같은 빛을 더한 이유는 무엇인가요?" },
    { category: "감상 포인트", question: "빛의 색과 원형 구조를 중심으로 어떻게 감상하면 좋나요?" },
    { category: "전시 맥락", question: "작은 가구가 개인화된 집의 역할을 할 수 있다는 뜻인가요?" },
    { category: "재료와 제작", question: "캐비닛과 조명 기능은 하나의 구조 안에서 어떻게 결합되나요?" },
  ],
  "artwork-wearable-casa-planet-big": [
    { category: "작품 이해", question: "Planet Big은 조각인가요, 실제로 앉을 수 있는 가구인가요?" },
    { category: "작품 이해", question: "공기를 넣는 대형 시팅볼을 행성처럼 만든 이유는 무엇인가요?" },
    { category: "감상 포인트", question: "거대한 크기와 둥근 형태가 관람객에게 어떤 느낌을 주나요?" },
    { category: "전시 맥락", question: "웰니스 기능이 웨어러블 카사의 주제와 어떻게 이어지나요?" },
    { category: "재료와 제작", question: "MCM 패턴의 표면과 팽창 구조를 함께 사용한 효과는 무엇인가요?" },
  ],
  "artwork-wearable-casa-magic-gilet": [
    { category: "작품 이해", question: "Magic Gilet은 조끼와 수납장 중 어느 쪽에 더 가까운가요?" },
    { category: "작품 이해", question: "집의 수납공간을 몸으로 옮긴다는 것은 무슨 뜻인가요?" },
    { category: "재료와 제작", question: "착용할 때와 세워 둘 때 형태가 어떻게 달라지나요?" },
    { category: "비하인드", question: "Vitra의 Uten.Silo에서 어떤 영감을 받았나요?" },
    { category: "감상 포인트", question: "주머니의 크기와 배치를 살펴볼 때 무엇을 생각해 보면 좋나요?" },
  ],
  "artwork-wearable-casa-pet-backpack": [
    { category: "작품 이해", question: "Pet Backpack은 반려동물에게 어떤 이동 공간을 제공하나요?" },
    { category: "작품 이해", question: "사람뿐 아니라 반려동물까지 이동형 집의 구성원으로 본 이유는 무엇인가요?" },
    { category: "재료와 제작", question: "크기 조절 컴파트먼트와 패딩은 어떤 역할을 하나요?" },
    { category: "감상 포인트", question: "일반 패션 백팩과 비교하면 어떤 차이가 보이나요?" },
    { category: "전시 맥락", question: "도시 생활자를 위한 디자인이라는 점은 어디에서 드러나나요?" },
  ],
  "artwork-wearable-casa-mindteaser-chair": [
    { category: "작품 이해", question: "Mindteaser Chair는 왜 퍼즐이나 루빅스 큐브처럼 보이나요?" },
    { category: "작품 이해", question: "다섯 가지 형태를 조합하면 어떤 가구로 바꿀 수 있나요?" },
    { category: "감상 포인트", question: "사용자가 직접 기능을 재구성한다는 점이 왜 중요한가요?" },
    { category: "재료와 제작", question: "모듈형 구조는 이동과 보관에 어떤 장점이 있나요?" },
    { category: "전시 맥락", question: "비디오게임의 영감이 디지털 노마드 생활과 어떻게 연결되나요?" },
  ],
  "artwork-berbrick-nobuki-hizume-installation": [
    { category: "작품 이해", question: "노부키 히즈메는 BE@RBRICK에 왜 모자를 씌웠나요?" },
    { category: "재료와 제작", question: "오트 쿠튀르 모자는 일반 모자와 제작 방식이 어떻게 다른가요?" },
    { category: "감상 포인트", question: "같은 캐릭터가 모자에 따라 서로 다른 인물처럼 보이는 이유는 무엇인가요?" },
    { category: "전시 맥락", question: "패션 액세서리가 독립된 예술 오브제가 되는 지점은 어디인가요?" },
    { category: "비하인드", question: "미러룸의 반복되는 반사는 작품 감상에 어떤 효과를 주나요?" },
  ],
  "artwork-berbrick-ken-yashiki-1000": [
    { category: "작품 이해", question: "켄 야시키는 가족의 기억을 BE@RBRICK에 어떻게 담았나요?" },
    { category: "재료와 제작", question: "키메코미 기법은 천을 표면에 어떻게 고정하는 방식인가요?" },
    { category: "감상 포인트", question: "서로 다른 직물 조각의 무늬와 이음선을 어떻게 보면 좋나요?" },
    { category: "작품 이해", question: "1000%라는 큰 크기가 개인적인 기억에 어떤 효과를 더하나요?" },
    { category: "전시 맥락", question: "전통적인 직물 기법과 현대 캐릭터의 결합에는 어떤 의미가 있나요?" },
  ],
  "artwork-berbrick-pause-usa-usa": [
    { category: "작품 이해", question: "〈PAUSE–Usa Usa〉라는 제목은 어떤 장면을 뜻하나요?" },
    { category: "작품 이해", question: "토끼 모티프는 작품에서 어떤 감정이나 기억을 나타내나요?" },
    { category: "감상 포인트", question: "이 작품의 부드러운 인상과 BE@RBRICK의 단단한 형태를 비교해 주세요." },
    { category: "전시 맥락", question: "COSMOS IN BLOOM 공간과 이 작품은 어떻게 어울리나요?" },
    { category: "재료와 제작", question: "직물의 패턴과 색이 작품의 분위기를 어떻게 바꾸나요?" },
  ],
  "artwork-berbrick-inden-ya-1000": [
    { category: "작품 이해", question: "INDEN-YA의 BE@RBRICK에는 어떤 전통 공예가 사용됐나요?" },
    { category: "재료와 제작", question: "고슈 인덴은 사슴가죽과 옻을 어떻게 사용하는 기법인가요?" },
    { category: "감상 포인트", question: "검은 표면의 무늬와 광택은 가까이에서 어떻게 살펴보면 좋나요?" },
    { category: "전시 맥락", question: "400년 전통 기술이 현대 팝 아이콘과 만나면 어떤 의미가 생기나요?" },
    { category: "비하인드", question: "400%와 1000% 작품은 크기 외에 감상 경험이 어떻게 다른가요?" },
  ],
};

const artworkExhibitionIds: Record<string, string> = {
  "artwork-fam-infinity": "exhibition-fam-2022",
  "artwork-fam-muimui": "exhibition-fam-2022",
  "artwork-fam-giyeok-moment": "exhibition-fam-2022",
  "artwork-fam-dj-trunk": "exhibition-fam-2022",
  "artwork-wearable-casa-chatty-sofa": "exhibition-wearable-casa-2024",
  "artwork-wearable-casa-tatamu": "exhibition-wearable-casa-2024",
  "artwork-wearable-casa-clepsydra": "exhibition-wearable-casa-2024",
  "artwork-wearable-casa-planet-small": "exhibition-wearable-casa-2024",
  "artwork-wearable-casa-planet-medium": "exhibition-wearable-casa-2024",
  "artwork-wearable-casa-planet-big": "exhibition-wearable-casa-2024",
  "artwork-wearable-casa-magic-gilet": "exhibition-wearable-casa-2024",
  "artwork-wearable-casa-pet-backpack": "exhibition-wearable-casa-2024",
  "artwork-wearable-casa-mindteaser-chair": "exhibition-wearable-casa-2024",
  "artwork-berbrick-nobuki-hizume-installation": "exhibition-berbrick-wonderland-2025",
  "artwork-berbrick-ken-yashiki-1000": "exhibition-berbrick-wonderland-2025",
  "artwork-berbrick-pause-usa-usa": "exhibition-berbrick-wonderland-2025",
  "artwork-berbrick-inden-ya-1000": "exhibition-berbrick-wonderland-2025",
};

export function getDocentQuestionPresets(artworkId: string, artworkTitle: string) {
  const exhibitionId = artworkExhibitionIds[artworkId];
  return [
    ...(artworkQuestions[artworkId] ?? []),
    ...(exhibitionQuestions[exhibitionId] ?? []),
    ...commonQuestions(artworkTitle),
  ];
}

export const docentQuestionPresets = artworkQuestions;
