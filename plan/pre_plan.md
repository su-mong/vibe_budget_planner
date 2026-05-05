# vibe_budget_planner.pen의 세부사항

## Overview
이 파일은 가계부 웹페이지 'Budget Recorder'의 기획안 vibe_budget_planner.pen의 세부사항을 정리한 파일이다.

### 페이지 구성
Login, Budget Dashboard, Calendar View, Budget Management, Settings의 5개 페이지가 존재한다.
- Login이 첫페이지이다.
- Budget Dashboard, Calendar View, Budget Management, Settings는 a common sidebar with navigation를 공유한다.

### 공통 사항
- 모든 숫자 표기는 3자리 단위 ,를 적용한다.

### Budget Dashboard 세부사항
- Node 18VBh의 경우, Node 4zMpA를 클릭하면 Node 868MS로 UI가 변경된다.
- Node 868MS에서 Node Y0QdX를 클릭하면 입력한 목표가 반영되고, Node 18VBh로 UI가 변경된다.
- Node O7FrB를 누르면 이전 연월의 데이터가 나온다.
- Node xSwnV를 누르면 다음 연월의 데이터가 나온다.

### Calendar View의 세부사항
- Node egnbY는 Calendar이다. 선택된 날짜에 대해서만 Node 7ac0s와 같이 파란색 테두리와 색상이 적용되고, '+' 버튼이 생긴다.
- Node egnbY의 '+' 버튼을 누르면, Node 5nJ6G가 Popup 형태로 등장한다.
- '지출 내역' 표의 메인 항목을 클릭하면 아코디언처럼 세부 항목이 접히거나 펼쳐진다. 여기서 메인 항목의 예시는 Node NRFRU, Node IKHKC, Node D66Y1이다.
- Node V3qHV를 누르면 이전 연월의 데이터가 나온다.
- Node NAheh를 누르면 다음 연월의 데이터가 나온다.

### Node 5nJ6G의 세부사항
- Node 5nJ6G는 지출 입력 팝업이다.
- '항목 선택'에서 선택한 값에 따라 '세부 항목 선택'의 라디오 항목이 변경된다.
- '항목 선택'에서 기존의 선택한 값을 다른 값으로 변경할 경우, '세부 항목 선택'과 '가격 입력'의 기존 값은 초기화된다.
- '항목 선택', '세부 항목 선택', '가격 입력'의 모든 값이 존재해야 '확인' 버튼이 활성화된다.
- '확인' 버튼을 누르면 새로운 지출 내역이 입력되고, 팝업이 사라진다.
- '취소' 버튼을 누르면 팝업이 사라진다.

### Budget Management의 세부사항
- Node BHY2k에서 Node vqBrq를 누르면 Node BSUxa로 변경된다. 여기서 Node uxzCS를 누르면 바뀐 값이 적용되고, 다시 Node BHY2k로 되돌아간다.
- Node qOns5에서 Node ESFmN를 누르면 Node 0SDLs로 변경된다. 여기서 Node uMJrZ를 누르면 바뀐 값이 적용되고, 다시 Node qOns5로 되돌아간다.
- Node 89ClV에서 Node EzJwW를 누르면 Node dXkzz로 변경된다. 여기서 Node htuwd를 누르면 바뀐 값이 적용되고, 다시 Node 89ClV로 되돌아간다.
- Node CaHRV에서 Node BGIUH를 누르면 Node mMme7로 변경된다. 여기서 Node PI8hx를 누르면 바뀐 값이 적용되고, 다시 Node CaHRV로 되돌아간다.
- Node Q5Xpd에서 Node qRjbq를 누르면 Node thxN2로 변경된다. 여기서 Node pWwyW를 누르면 바뀐 값이 적용되고, 다시 Node Q5Xpd로 되돌아간다.
- '추가 수입' 표에서 '+' 버튼을 누르면 Node IWh06가 Popup 형태로 등장한다.
- Node 8lpYe를 누르면 이전 연월의 데이터가 나온다.
- Node 41DKW를 누르면 다음 연월의 데이터가 나온다.

### Node IWh06의 세부사항
- Node IWh06는 추가 수입 입력 팝업이다.
- 항목명, 금액 모두 입력된 값이 있어야 '확인' 버튼이 활성화된다.
- '확인' 버튼을 누르면 새로운 추가 수입 내역이 입력되고, 팝업이 사라진다.
- '취소' 버튼을 누르면 팝업이 사라진다.

### Settings의 세부사항
- Node LBJYo가 켜져 있으면 Budget Dashboard의 목표 UI가 나온다. 꺼져 있으면 목표 UI를 숨긴다. 
- Node bSlMQ를 누르면 Node tU2Yl가 Popup 형태로 등장한다.
- Node AYMDh를 누르면 Node oUDiv가 Popup 형태로 등장한다.
- Node iKwdb를 누르면 Node 1vk15가 Popup 형태로 등장한다.
- Node wgUgw를 누르면 Node e9KRs가 Popup 형태로 등장한다.
- Settings의 모든 표의 휴지통 모양 버튼을 누르면 해당 항목이 삭제된다.
- Node tU2Yl Popup에서 '항목명'이 1글자 이상 있어야 '확인' 버튼이 활성화된다.
- Node tU2Yl Popup에서 '확인' 버튼을 누르면 수입 항목에 새 값이 추가되고, 팝업이 사라진다.
- Node oUDiv Popup에서 '항목 선택'에 선택된 값이 있고, '세부 항목 입력'에 1글자 이상 있어야 '확인' 버튼이 활성화된다.
- Node oUDiv Popup에서 '항목 선택'의 기존의 선택한 값을 다른 값으로 변경할 경우, '세부 항목 입력'이 초기화된다.
- Node oUDiv Popup에서 '확인' 버튼을 누르면 지출 항목의 주 항목 밑으로 새 값이 추가되고, 팝업이 사라진다.
- Node 1vk15 Popup에서 '항목명'이 1글자 이상 있어야 '확인' 버튼이 활성화된다.
- Node 1vk15 Popup에서 '확인' 버튼을 누르면 저축 항목에 새 값이 추가되고, 팝업이 사라진다.
- Node e9KRs Popup에서 '항목명'이 1글자 이상 있어야 '확인' 버튼이 활성화된다.
- Node e9KRs Popup에서 '확인' 버튼을 누르면 부채 항목에 새 값이 추가되고, 팝업이 사라진다.