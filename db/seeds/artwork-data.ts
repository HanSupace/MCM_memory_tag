import type { ArtworkSeed } from "../types/exhibition";
import { notionSource, wearableCasaSource } from "./exhibition-data";

export const artworks = [
  {
    id: "artwork-fam-infinity",
    exhibitionId: "exhibition-fam-2022",
    slug: "infinity",
    title: "INFINITY",
    artistName: "최정화",
    imageUrl: "/artworks/fam/infinity.png",
    series: "Journey to Infinity",
    type: "오브제 설치",
    form: "뫼비우스의 띠를 연상시키는 순환 구조",
    location: "MCM HAUS B1·1F 전시 동선의 시작",
    summary:
      "여러 개의 밥그릇을 이어 시작과 끝을 구분할 수 없는 고리 형태로 만든 설치 작품입니다.",
    description:
      "멀리서 보면 하나의 커다란 조각이지만 가까이 다가가면 각기 다른 그릇이 반복적으로 연결되어 있습니다. 한국 문화에서 함께 밥을 먹는 행위와 밥그릇은 가족과 공동체를 형성하는 관계를 상징합니다. 각각의 그릇은 한 사람을, 이어진 구조는 사람과 사람 사이의 관계와 세대를 거쳐 이어지는 공동체를 떠올리게 합니다.",
    titleMeaning:
      "Infinity는 무한을 뜻합니다. 분명한 출발점과 도착점이 없는 형태를 통해 삶을 직선이 아니라 만남과 이별, 기억과 재생이 반복되는 순환으로 바라봅니다.",
    interpretation:
      "독립된 각각의 그릇이 하나의 전체를 이루는 모습은 서로 다른 개인이 관계 속에서 공동체를 형성하는 과정을 보여줍니다. 안과 밖을 나누기 어려운 구조는 생활과 예술, 고급과 저급, 개인과 공동체의 경계를 허무는 작가의 관점과 연결됩니다.",
    viewingTips: [
      "멀리서 전체 형태를 먼저 본 다음 가까이에서 그릇 하나하나를 살펴보세요.",
      "각 그릇이 독립된 사물이면서 전체 구조의 일부가 되는 방식을 관찰해 보세요.",
    ],
    keywords: ["무한", "순환", "가족", "관계", "공존", "공동체", "밥그릇"],
    tmi: [
      "이 작품은 MCM HAUS에서 처음 만들어진 완전히 새로운 형식이라기보다 최정화가 여러 공간에서 지속적으로 변주해 온 작품 계열입니다.",
      "2022년 운경고택 전시에서는 밥그릇으로 구성된 《Infinity》가 가족이라는 관계를 상징했습니다.",
      "같은 작품이라도 설치되는 장소와 그릇의 배열에 따라 크기와 인상이 달라질 수 있습니다.",
      "뫼비우스의 띠는 안과 밖을 명확하게 나눌 수 없는 구조입니다. 이는 최정화가 허물고자 하는 생활과 예술, 고급과 저급, 개인과 공동체의 경계와도 연결됩니다.",
      "작품의 핵심은 비싼 재료가 아니라 누구나 사용해 본 밥그릇이 거대한 관계의 상징으로 변한다는 점입니다.",
    ],
    facts: [
      "최정화가 여러 공간에서 지속해서 변주해 온 작품 계열입니다.",
      "설치 장소와 그릇의 배열에 따라 작품의 크기와 인상이 달라질 수 있습니다.",
      "작품의 의미는 값비싼 재료보다 일상적인 밥그릇이 관계의 상징으로 변하는 데 있습니다.",
    ],
    displayOrder: 1,
    source: notionSource,
  },
  {
    id: "artwork-fam-muimui",
    exhibitionId: "exhibition-fam-2022",
    slug: "muimui",
    title: "무이무이",
    artistName: "최정화",
    imageUrl: "/artworks/fam/muimui.png",
    series: "무이무이 시리즈",
    type: "고가구·수집품·생활 오브제 설치",
    location: "MCM HAUS 1F 입구",
    summary:
      "오래된 한국 가구 위나 안에 현대적인 생활용품과 장식물을 배치한 설치 작품입니다.",
    description:
      "고가구와 플라스틱 제품, 반짝이는 장식과 동물상처럼 시대와 취향이 다른 물건들이 하나의 구조 안에서 공존합니다. 작가는 물건을 원래 용도나 가격에 따라 구분하지 않고 함께 배치해 어떤 물건이 더 고급스럽거나 예술적이라는 기존의 위계를 흔듭니다.",
    titleMeaning:
      "무이무이(無異無二)는 다르지 않고 둘도 아니라는 뜻입니다. 서로 어울리지 않아 보이는 사물도 하나의 환경과 관계 안에서 연결된다는 상호의존의 관점을 담고 있습니다.",
    interpretation:
      "오래된 가구와 대량생산된 생활용품을 같은 위치에 놓음으로써 전통과 현대, 귀한 것과 평범한 것의 경계를 다시 생각하게 합니다. 사물의 낡은 표면과 사용 흔적도 사물이 살아온 시간을 보여주는 작품의 일부입니다.",
    viewingTips: [
      "가장 오래되어 보이는 물건과 가장 현대적으로 보이는 물건을 찾아보세요.",
      "서로 다른 두 물건이 함께 놓였을 때 각각의 인상이 어떻게 달라지는지 비교해 보세요.",
    ],
    keywords: ["공존", "수집", "기억", "전통과 현대", "고가구", "생활용품"],
    tmi: [
      "《무이무이》에 사용되는 가구 상당수는 작가가 오랫동안 수집하거나 버려진 장소에서 발견한 물건들입니다.",
      "최정화의 작업실은 플라스틱 병뚜껑, 오래된 가구, 생활용품과 건축 폐기물까지 모여 있는 만물상처럼 알려져 있습니다.",
      "작가는 자신이 수집한 사물을 종종 사부님이라고 부릅니다. 사물을 일방적으로 작품의 재료로 사용하는 것이 아니라 사물로부터 형태와 배치 방법을 배운다는 의미입니다.",
      "작품의 중요한 행위는 제작뿐 아니라 수집하고, 고르고, 쌓고, 진열하는 것입니다.",
      "무이무이는 특정한 하나의 조각을 가리키기도 하지만 다양한 고가구와 오브제를 결합하는 작품군 또는 공간 개념으로 사용되기도 합니다.",
      "작품의 물건들은 새것처럼 복원되지 않습니다. 사용 흔적과 낡은 표면도 사물이 살아온 시간을 보여주는 작품의 일부입니다.",
    ],
    facts: [
      "작품에 사용되는 가구 상당수는 작가가 오랫동안 수집하거나 버려진 장소에서 발견한 물건입니다.",
      "작가는 자신이 수집한 사물을 형태와 배치 방법을 가르쳐 주는 사부님이라고 부르기도 합니다.",
      "작품의 중요한 행위에는 제작뿐 아니라 수집, 선택, 쌓기와 진열이 포함됩니다.",
      "무이무이는 하나의 조각뿐 아니라 다양한 고가구와 오브제를 결합하는 작품군 또는 공간 개념으로도 사용됩니다.",
    ],
    displayOrder: 2,
    source: notionSource,
  },
  {
    id: "artwork-fam-giyeok-moment",
    exhibitionId: "exhibition-fam-2022",
    slug: "the-moment-of-giyeok",
    title: "ㄱ의 순간",
    artistName: "최정화",
    imageUrl: "/artworks/fam/giyeok-moment.png",
    type: "농기구·네온 문자 설치",
    form: "오래된 나무 쟁기와 한글 네온사인의 결합",
    location: "MCM HAUS 2층으로 올라가는 계단 부근",
    summary:
      "오래된 나무 쟁기 위에 빛나는 한글 네온 문자를 결합해 과거와 현재가 동시에 존재하는 장면을 만든 작품입니다.",
    description:
      "쟁기는 땅을 갈고 생명을 키우는 오래된 도구이고 네온은 전기, 도시와 현대 시각문화를 상징합니다. 작가는 오래된 문명의 흔적 위에 현대적인 빛의 언어를 배치해 서로 멀리 떨어진 시간대가 함께 호흡하도록 구성했습니다.",
    titleMeaning:
      "ㄱ은 한글의 첫 자음으로 모든 말이 시작되기 직전의 최초 단위처럼 볼 수 있습니다. 기억, 관계, 과거, 가족, 길과 기원 등 여러 단어를 열어 두어 관람객이 각자의 ㄱ을 떠올리게 합니다.",
    interpretation:
      "원시적인 노동 도구와 현대 도시의 네온 기술이 하나의 선과 구조를 만들면서 기억과 언어, 과거와 현재의 관계를 보여줍니다. 계단 부근이라는 위치도 관람객이 층 사이를 이동하는 순간과 작품의 시간 이동 의미를 겹치게 합니다.",
    viewingTips: [
      "네온 문자를 읽기 전에 그 아래 오래된 나무의 형태를 먼저 살펴보세요.",
      "네온이 켜졌을 때와 꺼졌을 때 시선이 문자와 쟁기 사이에서 어떻게 달라지는지 비교해 보세요.",
    ],
    keywords: ["기억", "노동", "언어", "원시와 현대", "쟁기", "네온", "한글"],
    tmi: [
      "작품에 사용된 쟁기는 작가가 약 15년 전 영국의 아프리카 골동품점에서 발견해 여러 개를 수집한 것으로 알려졌습니다.",
      "쟁기의 정확한 문화적 출처를 단순히 한국 전통 농기구라고 설명하면 부정확할 수 있습니다.",
      "작품은 2020년 조선일보 창간 100주년 한글 특별전 《ㄱ의 순간》을 위해 제작된 작업에서 출발했습니다.",
      "작가는 석기시대를 연상시키는 농기구와 현대적인 네온 기술을 연결해 서로 멀리 떨어진 시간대가 함께 호흡하도록 구성했습니다.",
      "MCM HAUS에서는 계단 근처에 설치돼 관람객이 실제로 층과 층 사이를 이동하는 순간 작품을 만나게 됩니다. 과거에서 현재로 이동한다는 작품의 의미와 공간적 동선이 자연스럽게 겹쳐집니다.",
      "네온이 켜진 상태와 꺼진 상태에서 작품의 인상이 크게 달라집니다. 불이 켜지면 문자에 시선이 집중되고 꺼지면 오래된 쟁기의 형태와 재료가 더 잘 드러납니다.",
    ],
    facts: [
      "작품은 2020년 한글 특별전 《ㄱ의 순간》을 위해 제작된 작업에서 출발했습니다.",
      "작품에 사용된 쟁기는 작가가 영국의 아프리카 골동품점에서 발견해 수집한 것으로 알려져 있어 정확한 문화적 출처를 한국 전통 농기구로 단정하면 부정확할 수 있습니다.",
      "MCM HAUS에서는 층과 층 사이를 이동하는 계단 부근에 설치됐습니다.",
    ],
    displayOrder: 3,
    source: notionSource,
  },
  {
    id: "artwork-fam-dj-trunk",
    exhibitionId: "exhibition-fam-2022",
    slug: "mcm-johannes-wohnseifer-dj-trunk",
    title: "MCM × 요하네스 본자이퍼 DJ 트렁크",
    artistName: "요하네스 본자이퍼",
    imageUrl: "/artworks/fam/dj-trunk.png",
    collaborator: "MCM",
    type: "혼합매체·기능성 오브제",
    material: "코냑 비세토스 모노그램",
    location: "MCM HAUS 1F",
    summary:
      "MCM 여행용 트렁크를 DJ 장비와 작가의 수집품을 담는 이동식 예술 공간으로 변환한 작품입니다.",
    description:
      "트렁크를 열면 작가와 MCM의 역사 및 취향을 상징하는 이미지, 음악과 오브제가 등장합니다. 가방은 물건을 운반하는 도구를 넘어 기억과 문화를 이동시키는 아카이브가 됩니다.",
    interpretation:
      "유럽 르네상스와 바로크 시대의 분더캄머처럼 서로 다른 예술품과 기념품을 한 공간에 모읍니다. 공적인 브랜드 역사와 작가의 사적인 기억을 함께 담아 여행, 수집과 문화적 이동이라는 MCM의 정체성을 확장합니다.",
    viewingTips: [
      "트렁크 안에서 MCM의 역사에 속하는 물건과 작가 개인의 취향에 속하는 물건을 구분해 보세요.",
      "두 영역을 명확하게 나눌 수 없는 이유를 생각해 보세요.",
    ],
    keywords: ["여행", "기억", "음악", "아카이브", "분더캄머", "트렁크", "MCM"],
    tmi: [
      "작품은 2022년 서울에서 처음 공개된 것이 아니라 베를린 갤러리 위크엔드에서 먼저 선보인 뒤 서울로 이동했습니다.",
      "트렁크가 실제로 도시를 이동했다는 사실 자체가 여행과 이동을 강조해 온 MCM의 브랜드 정체성과 연결됩니다.",
      "작품의 원형은 유럽 르네상스와 바로크 시대의 분더캄머입니다. 당시 수집가들은 자연물, 예술품, 과학 기구와 진귀한 물건을 하나의 방이나 캐비닛에 모았습니다.",
      "기린은 본자이퍼가 좋아하는 동물 중 하나입니다. 단순한 MCM 상품이 아니라 작가의 개인적인 취향이 포함된 자전적 오브제입니다.",
      "DJ 케이스라는 형식은 시각예술에 음악을 더합니다. 작품을 바라보는 것뿐 아니라 음악을 재생하고 함께 모이는 사회적 기능까지 암시합니다.",
      "명품 트렁크와 개인적인 기념품을 함께 넣음으로써 공적인 브랜드 역사와 사적인 기억의 경계를 흐립니다.",
    ],
    facts: [
      "작품은 베를린 갤러리 위크엔드에서 먼저 선보인 뒤 서울로 이동했습니다.",
      "트렁크가 실제 도시를 이동했다는 사실은 여행과 이동을 강조하는 MCM의 브랜드 정체성과 연결됩니다.",
      "DJ 케이스 형식은 작품 감상에 음악 재생과 함께 모이는 사회적 기능을 더합니다.",
      "기린은 본자이퍼가 좋아하는 동물 중 하나로 작가의 개인적 취향을 보여주는 오브제입니다.",
    ],
    contents: [
      "알루미늄 회화",
      "MCM 가죽 기린 인형",
      "자동차 포스터",
      "과거 MCM 카탈로그에서 가져온 디자인",
      "셰벤 & 포스의 미공개 음악",
      "작가와 MCM의 기념품 및 수집 오브제",
    ],
    displayOrder: 4,
    source: notionSource,
  },
  {
    id: "artwork-wearable-casa-chatty-sofa",
    exhibitionId: "exhibition-wearable-casa-2024",
    slug: "chatty-sofa",
    title: "Chatty Sofa",
    artistName: "Atelier Biagetti",
    imageUrl: "/artworks/wearable-casa/chatty-sofa.png",
    collaborator: "MCM",
    type: "3인용 문자형 소파",
    form: "CASA 네 글자를 시각화한 조형",
    material: "고무 폼, 테디 원단",
    location: "MCM HAUS 3F 메인 리빙 공간",
    summary:
      "CASA라는 단어를 세 사람이 앉을 수 있는 소파로 바꾸어 집을 대화와 연결이 일어나는 공간으로 표현한 작품입니다.",
    description:
      "가로 200cm, 세로 115cm, 높이 93cm의 소파로, 부드러운 고무 폼을 테디 원단으로 마감했습니다. 스트리트 그래피티와 도시 예술을 떠올리게 하는 문자형 조형 안에 좌석, 대화 공간, 기기 연결과 충전 기능을 함께 담았습니다.",
    titleMeaning:
      "Chatty는 수다스러운이라는 뜻입니다. 소파를 단순히 앉는 가구가 아니라 사람과 디지털 기기가 만나 대화하는 집의 중심으로 바라봅니다.",
    interpretation:
      "집을 뜻하는 CASA가 실제 가구가 되면서 단어, 공간과 신체가 하나로 연결됩니다. 아날로그 대화와 디지털 기기 충전을 동시에 지원하는 기능은 오늘날의 거실이 사람과 기술이 함께 머무는 커뮤니케이션 공간이라는 점을 보여줍니다.",
    viewingTips: [
      "소파의 전체 윤곽에서 CASA의 각 글자가 어떻게 연결되는지 찾아보세요.",
      "조형적인 외관과 실제 좌석·충전 기능이 한 오브제 안에서 어떻게 공존하는지 살펴보세요.",
    ],
    keywords: ["CASA", "대화", "연결", "소파", "그래피티", "디지털 기기"],
    tmi: [
      "Studio 65가 1970년대에 선보인 입술 모양 Bocca Sofa를 디자인 참조로 삼았습니다.",
      "작품은 사람의 대화뿐 아니라 기기 연결과 충전까지 포함해 디지털 시대의 커뮤니케이션 공간을 제안합니다.",
    ],
    facts: [
      "3인용 소파이며 크기는 가로 200cm, 세로 115cm, 높이 93cm입니다.",
      "고무 폼 소재를 테디 원단으로 마감했습니다.",
      "좌석, 대화 공간, 기기 연결과 충전 기능을 갖습니다.",
    ],
    displayOrder: 1,
    source: wearableCasaSource,
  },
  {
    id: "artwork-wearable-casa-tatamu",
    exhibitionId: "exhibition-wearable-casa-2024",
    slug: "tatamu",
    title: "Tatamu",
    artistName: "Atelier Biagetti",
    imageUrl: "/artworks/wearable-casa/tatamu.png",
    collaborator: "MCM",
    type: "변형형 모듈 좌석·데이베드·매트",
    form: "롤 형태의 매트를 접고 펼쳐 변형하는 구조",
    location: "MCM HAUS 3F 메인 리빙 공간",
    summary:
      "부드러운 롤형 매트를 접고 펼치는 방법에 따라 좌석, 데이베드와 다다미형 공간으로 바뀌는 모듈 가구입니다.",
    description:
      "싱글 모듈은 180×90×10cm이며, 270×270×10cm의 타타미형 매트, 180×90×40cm의 데이베드와 90×90×40cm의 푸프 형태로 변형할 수 있습니다. 노랑, 빨강, 파랑과 흰색을 사용하며 코냑 컬러와 라탄을 결합한 버전도 있습니다.",
    titleMeaning:
      "Tatamu는 접는다는 뜻의 일본어 畳む에서 가져온 이름입니다. 하나의 물건을 접고 펼치는 단순한 행위가 공간의 기능을 바꿉니다.",
    interpretation:
      "고정된 가구 대신 사용자의 상황과 공간에 맞춰 형태를 바꾸는 구조는 디지털 노마드의 유동적인 생활방식을 반영합니다. 바우하우스 색채와 기능주의를 현대적인 휴식 방식과 연결합니다.",
    viewingTips: [
      "같은 모듈이 평평한 매트와 높이가 있는 좌석으로 바뀌는 접힘 구조를 따라가 보세요.",
      "노랑, 빨강, 파랑과 흰색의 조합에서 바우하우스의 색채 언어를 찾아보세요.",
    ],
    keywords: ["접기", "변형", "모듈", "데이베드", "바우하우스", "이동형 가구"],
    tmi: [
      "Eileen Gray의 데이베드와 바우하우스의 원색 사용을 디자인 참조로 삼았습니다.",
      "코냑 컬러와 라탄을 결합한 별도 버전은 MCM의 소재 언어를 리빙 오브제로 확장합니다.",
    ],
    facts: [
      "싱글 모듈 크기는 180×90×10cm입니다.",
      "타타미형, 데이베드형과 푸프형으로 구성할 수 있습니다.",
      "명칭은 접는다는 의미의 일본어 畳む에서 유래했습니다.",
    ],
    contents: [
      "싱글 모듈 — 180×90×10cm",
      "타타미형 — 270×270×10cm",
      "데이베드형 — 180×90×40cm",
      "푸프형 — 90×90×40cm",
    ],
    displayOrder: 2,
    source: wearableCasaSource,
  },
  {
    id: "artwork-wearable-casa-clepsydra",
    exhibitionId: "exhibition-wearable-casa-2024",
    slug: "clepsydra-lantern",
    title: "Clepsydra Lantern",
    artistName: "Atelier Biagetti",
    imageUrl: "/artworks/wearable-casa/clepsydra.png",
    collaborator: "MCM",
    type: "휴대용 충전식 테이블 조명·착용형 오브제",
    form: "모래시계를 닮은 형태와 분리 가능한 램프 갓",
    material: "가죽, 아연 도금 알루미늄, 라탄",
    location: "MCM HAUS 3F 메인 리빙 공간",
    summary:
      "충전식 LED 테이블 조명의 갓을 분리해 모자로 착용할 수 있도록 만든 이동형 조명입니다.",
    description:
      "가로 17cm, 세로 15cm, 높이 38cm의 모래시계형 조명으로 가죽, 아연 도금 알루미늄과 라탄을 결합했습니다. 전선에 고정되지 않는 충전식 LED를 사용하며 램프 갓은 머리에 쓰는 모자로 변형됩니다.",
    titleMeaning:
      "Clepsydra는 물시계를 뜻합니다. 모래시계를 닮은 외형과 이동하며 시간을 보내는 생활방식을 함께 떠올리게 합니다.",
    interpretation:
      "집 안에 고정되던 조명을 몸에 착용하고 이동할 수 있게 바꾸어 집의 기능이 사람을 따라다니게 합니다. 빛을 제공하는 가구와 패션 액세서리가 하나의 오브제 안에서 교차합니다.",
    viewingTips: [
      "조명 전체를 본 뒤 분리되는 램프 갓이 모자로 바뀌는 경계를 찾아보세요.",
      "가죽, 금속과 라탄처럼 성격이 다른 재료가 휴대성과 집의 안락함을 어떻게 함께 표현하는지 살펴보세요.",
    ],
    keywords: ["조명", "모자", "휴대성", "이중 용도", "LED", "착용"],
    tmi: [
      "전원은 충전식이어서 콘센트가 없는 장소에서도 사용할 수 있습니다.",
      "램프 갓을 모자로 착용하는 순간 집의 조명이 패션 아이템으로 바뀝니다.",
    ],
    facts: [
      "크기는 가로 17cm, 세로 15cm, 높이 38cm입니다.",
      "가죽, 아연 도금 알루미늄과 라탄으로 제작됐습니다.",
      "충전식 LED 조명이며 램프 갓을 모자로 착용할 수 있습니다.",
    ],
    displayOrder: 3,
    source: wearableCasaSource,
  },
  {
    id: "artwork-wearable-casa-planet-small",
    exhibitionId: "exhibition-wearable-casa-2024",
    slug: "planet-small",
    title: "Planet Small",
    artistName: "Atelier Biagetti",
    imageUrl: "/artworks/wearable-casa/planet-small.png",
    collaborator: "MCM",
    series: "Space Cabinet·Planet Series",
    type: "거울이 포함된 구형 주얼리 미니백",
    form: "행성과 지구 밖 탐사를 연상시키는 소형 구체",
    location: "MCM HAUS 1F 우주·웨어러블 오브제 공간",
    summary:
      "행성과 외계 탐험에서 영감을 받은 구형 오브제를 거울이 포함된 주얼리 미니백으로 만든 작품입니다.",
    description:
      "Planet 시리즈에서 가장 작은 형태로, 몸에 지니는 가방과 개인 물건을 비추는 거울의 기능을 결합했습니다. 작은 행성을 연상시키는 구체와 체인 스트랩을 통해 이동하는 사람이 자신만의 작은 세계를 휴대한다는 개념을 보여줍니다.",
    interpretation:
      "행성처럼 완결된 구형 미니백은 새로운 장소를 탐험하는 이동자의 작은 세계를 상징합니다. 패션 액세서리와 개인 공간의 기능이 하나의 휴대 가능한 오브제로 결합됩니다.",
    viewingTips: [
      "가방의 구형 구조와 체인 스트랩이 행성의 형태와 궤도를 어떻게 떠올리게 하는지 살펴보세요.",
      "Planet Medium과 Big으로 크기가 커질 때 기능이 어떻게 달라지는지 비교해 보세요.",
    ],
    keywords: ["행성", "우주", "미니백", "거울", "주얼리", "휴대성"],
    tmi: [
      "세 오브제는 크기와 기능은 다르지만 행성 및 지구 밖 탐사라는 공통 레퍼런스를 공유합니다.",
      "Small은 패션 액세서리, Medium은 수납 가구, Big은 웰니스 좌석으로 확장됩니다.",
    ],
    facts: [
      "Planet Small은 거울이 있는 주얼리 미니백입니다.",
      "Space Cabinet·Planet Series에서 가장 작은 개별 항목입니다.",
    ],
    displayOrder: 4,
    source: wearableCasaSource,
  },
  {
    id: "artwork-wearable-casa-planet-medium",
    exhibitionId: "exhibition-wearable-casa-2024",
    slug: "planet-medium",
    title: "Planet Medium",
    artistName: "Atelier Biagetti",
    imageUrl: "/artworks/wearable-casa/planet-medium.png",
    collaborator: "MCM",
    series: "Space Cabinet·Planet Series",
    type: "후광이 있는 구형 미니 캐비닛",
    form: "빛나는 원형 후광을 갖춘 중형 구체",
    location: "MCM HAUS 1F 우주·웨어러블 오브제 공간",
    summary:
      "행성을 닮은 구형 수납공간과 빛나는 후광을 결합해 작은 캐비닛을 우주적 오브제로 바꾼 작품입니다.",
    description:
      "Planet 시리즈의 중간 크기 항목으로, 패션 액세서리보다 큰 수납 기능을 갖추면서도 공간 안에서 독립된 조형물처럼 보입니다. 중앙의 빛과 원형 테두리가 행성의 후광을 표현합니다.",
    interpretation:
      "수납장은 보통 벽이나 방에 고정되지만 Planet Medium은 하나의 작은 행성처럼 독립적으로 존재합니다. 집의 수납 기능을 새로운 장소로 옮길 수 있는 개인화된 공간으로 해석합니다.",
    viewingTips: [
      "중앙의 빛과 원형 테두리가 만드는 후광을 관찰해 보세요.",
      "작은 캐비닛이라는 실용적 기능과 우주적 조형이 어떻게 공존하는지 살펴보세요.",
    ],
    keywords: ["행성", "우주", "캐비닛", "후광", "수납", "조명"],
    tmi: [
      "세 Planet 오브제 가운데 패션 액세서리와 대형 가구 사이를 연결하는 중간 크기입니다.",
      "원형 후광은 캐비닛을 일상 가구가 아닌 하나의 천체처럼 보이게 합니다.",
    ],
    facts: [
      "Planet Medium은 후광이 있는 구형 미니 캐비닛입니다.",
      "Space Cabinet·Planet Series의 중간 크기 개별 항목입니다.",
    ],
    displayOrder: 5,
    source: wearableCasaSource,
  },
  {
    id: "artwork-wearable-casa-planet-big",
    exhibitionId: "exhibition-wearable-casa-2024",
    slug: "planet-big",
    title: "Planet Big",
    artistName: "Atelier Biagetti",
    imageUrl: "/artworks/wearable-casa/planet-big.png",
    collaborator: "MCM",
    series: "Space Cabinet·Planet Series",
    type: "공기 주입식 대형 웰니스 시팅볼",
    form: "몸을 지지하는 대형 구체",
    location: "MCM HAUS 1F 우주·웨어러블 오브제 공간",
    summary:
      "공기를 주입해 사용하는 대형 구체를 몸을 기대고 앉을 수 있는 웰니스 시팅볼로 만든 작품입니다.",
    description:
      "Planet 시리즈에서 가장 큰 항목으로, MCM 비세토스 패턴을 입힌 구형 표면과 가로 방향의 밴드 구조가 특징입니다. 공기를 넣고 뺄 수 있어 큰 가구도 이동 가능한 형태로 바뀝니다.",
    interpretation:
      "단단하고 무거운 좌석 대신 공기로 형태를 만드는 구조는 이동하는 집에 필요한 유연성과 휴대성을 보여줍니다. 작은 액세서리에서 시작한 Planet 시리즈가 몸 전체를 지지하는 생활공간으로 확장됩니다.",
    viewingTips: [
      "구체의 표면을 나누는 밴드와 비세토스 패턴이 형태를 어떻게 강조하는지 살펴보세요.",
      "공기를 빼면 이동할 수 있다는 점을 떠올리며 일반적인 가구와 비교해 보세요.",
    ],
    keywords: ["행성", "우주", "시팅볼", "웰니스", "공기 주입", "이동형 가구"],
    tmi: [
      "Planet Big은 단단한 가구가 아니라 공기를 주입해 사용하는 대형 웰니스 시팅볼입니다.",
      "공기를 빼면 부피를 줄일 수 있어 웨어러블 카사의 이동성 개념과 연결됩니다.",
    ],
    facts: [
      "Planet Big은 공기를 주입하는 대형 웰니스 시팅볼입니다.",
      "Space Cabinet·Planet Series에서 가장 큰 개별 항목입니다.",
    ],
    displayOrder: 6,
    source: wearableCasaSource,
  },
  {
    id: "artwork-wearable-casa-magic-gilet",
    exhibitionId: "exhibition-wearable-casa-2024",
    slug: "magic-gilet",
    title: "Magic Gilet",
    artistName: "Atelier Biagetti",
    imageUrl: "/artworks/wearable-casa/magic-gilet.png",
    collaborator: "MCM",
    type: "착용형 수납 오브제·자립형 홈 오브제",
    form: "조끼, 휴대용 수납장과 자립형 오브제로 변형",
    material: "MCM 비세토스 패턴 가죽",
    location: "MCM HAUS 1F 우주·웨어러블 오브제 공간",
    summary:
      "집의 수납공간을 몸으로 옮겨 조끼로 착용하거나 독립된 수납 오브제로 세울 수 있게 만든 작품입니다.",
    description:
      "접었을 때 40×5×56cm, 조끼로 착용했을 때 40×27×57cm, 단독으로 세웠을 때 40×21×56cm입니다. MCM 비세토스 패턴 가죽으로 제작되며 열쇠와 펜처럼 좋아하는 물건을 몸 가까이에 보관할 수 있습니다.",
    interpretation:
      "벽이나 가구에 고정되던 수납 기능을 사람의 몸으로 옮기면서 집을 휴대 가능한 개인 영역으로 바꿉니다. 착용하지 않을 때도 독립적인 오브제로 존재해 패션과 리빙 제품의 구분을 흐립니다.",
    viewingTips: [
      "접힌 상태, 착용 상태와 자립 상태에서 수납공간의 위치가 어떻게 달라지는지 살펴보세요.",
      "MCM의 가방 패턴이 조끼와 가구 사이를 연결하는 방식을 관찰해 보세요.",
    ],
    keywords: ["조끼", "수납", "비세토스", "웨어러블", "휴대용 집", "변형"],
    tmi: [
      "Dorothee Becker가 1969년 Vitra를 위해 디자인한 벽걸이 수납 시스템 Uten.Silo를 참조했습니다.",
      "착용하지 않을 때도 스스로 서는 독립적인 홈 오브제로 사용할 수 있습니다.",
    ],
    facts: [
      "접었을 때 크기는 40×5×56cm입니다.",
      "조끼 착용 상태는 40×27×57cm, 자립 상태는 40×21×56cm입니다.",
      "MCM 비세토스 패턴 가죽으로 제작됐습니다.",
    ],
    displayOrder: 7,
    source: wearableCasaSource,
  },
  {
    id: "artwork-wearable-casa-pet-backpack",
    exhibitionId: "exhibition-wearable-casa-2024",
    slug: "pet-backpack",
    title: "Pet Backpack",
    artistName: "Atelier Biagetti",
    imageUrl: "/artworks/wearable-casa/pet-backpack.png",
    collaborator: "MCM",
    type: "반려동물 이동용 백팩",
    form: "소형 반려동물을 위한 조절 가능한 이동형 컴파트먼트",
    material: "MCM 시그니처 비세토스 소재, 조절식 패딩",
    location: "MCM HAUS 1F 우주·웨어러블 오브제 공간",
    summary:
      "소형 반려동물과 함께 이동하는 도시 생활자를 위해 보호 기능과 조절 가능한 내부 공간을 갖춘 백팩입니다.",
    description:
      "MCM 시그니처 비세토스 패턴을 사용하며 내부 컴파트먼트의 크기를 조절할 수 있습니다. 조절 가능한 패딩 구조가 이동 중인 소형 반려동물을 편안하게 보호합니다.",
    interpretation:
      "웨어러블 카사가 제안하는 이동형 생활공간의 범위를 사람과 물건에서 반려동물까지 확장합니다. 이동 중에도 함께 머물 수 있는 안전한 공간을 제공해 집을 관계를 품고 이동하는 구조로 해석합니다.",
    viewingTips: [
      "일반적인 패션 백팩과 반려동물 보호 공간이 결합되는 구조를 살펴보세요.",
      "내부 크기와 패딩을 조절하는 기능이 이동성과 안락함을 어떻게 함께 만드는지 생각해 보세요.",
    ],
    keywords: ["반려동물", "백팩", "이동", "보호", "비세토스", "도시 생활"],
    tmi: [
      "웨어러블 카사의 이동형 집 개념은 사람뿐 아니라 함께 생활하는 소형 반려동물도 포함합니다.",
      "내부 컴파트먼트와 패딩을 조절해 반려동물의 크기와 이동 상황에 대응합니다.",
    ],
    facts: [
      "소형 반려동물과 함께 이동하는 도시 생활자를 대상으로 합니다.",
      "MCM 시그니처 비세토스 패턴을 사용합니다.",
      "내부에는 크기 조절식 컴파트먼트와 조절 가능한 패딩이 있습니다.",
    ],
    displayOrder: 8,
    source: wearableCasaSource,
  },
  {
    id: "artwork-wearable-casa-mindteaser-chair",
    exhibitionId: "exhibition-wearable-casa-2024",
    slug: "mindteaser-chair",
    title: "Mindteaser Chair",
    artistName: "Atelier Biagetti",
    imageUrl: "/artworks/wearable-casa/mindteaser-chair.png",
    collaborator: "MCM",
    series: "Mindteaser Chair·Cube·Stool",
    type: "재구성 가능한 모듈형 가구 작품군",
    form: "다섯 가지 형태를 조합하는 의자·스툴·커피테이블",
    location: "MCM HAUS 5F 미래형 모듈 가구·디지털 공간",
    summary:
      "비디오게임과 루빅스 큐브에서 영감을 받은 다섯 가지 형태를 조합해 의자, 스툴과 커피테이블로 사용하는 모듈 가구입니다.",
    description:
      "Mindteaser Chair와 Cube·Stool은 서로 다른 다섯 가지 형태를 사용자가 직접 조합하도록 설계됐습니다. 배치와 결합 방법에 따라 앉는 가구와 작은 테이블 등 필요한 기능과 공간 구성이 달라집니다.",
    titleMeaning:
      "Mind Teaser는 생각을 자극하는 퍼즐을 뜻합니다. 완성된 형태를 감상하는 대신 사용자가 조합을 고민하고 공간을 직접 구성하도록 유도합니다.",
    interpretation:
      "정해진 용도를 가진 하나의 가구 대신 여러 형태와 기능의 가능성을 제공합니다. 사용자가 필요에 따라 공간을 재구성한다는 점에서 디지털 노마드의 변화하는 생활과 게임 속 조립 규칙을 연결합니다.",
    viewingTips: [
      "다섯 가지 형태가 각각 어떤 방향으로 결합되는지 퍼즐처럼 살펴보세요.",
      "같은 모듈이 의자, 스툴과 커피테이블로 바뀔 때 사용자의 행동도 어떻게 달라지는지 상상해 보세요.",
    ],
    keywords: ["모듈", "퍼즐", "루빅스 큐브", "비디오게임", "의자", "재구성"],
    tmi: [
      "사용자는 완성된 가구를 수동적으로 사용하는 것이 아니라 다섯 가지 형태의 조합을 결정하는 공동 설계자가 됩니다.",
      "Chair와 Cube·Stool은 별도 형태이지만 하나의 Mind Teaser 작품군으로 같은 조합 원리를 공유합니다.",
    ],
    facts: [
      "Chair와 Stool·Cube 형태로 구성된 모듈형 가구 작품군입니다.",
      "의자, 스툴과 커피테이블 기능을 수행합니다.",
      "비디오게임과 루빅스 큐브에서 영감을 받아 다섯 가지 형태를 조합합니다.",
    ],
    contents: [
      "Mindteaser Chair — 재구성 가능한 모듈 의자",
      "Mindteaser Cube·Stool — 스툴 또는 커피테이블로 사용하는 큐브형 모듈",
    ],
    displayOrder: 9,
    source: wearableCasaSource,
  },
] satisfies ArtworkSeed[];
