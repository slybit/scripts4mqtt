import styled from "styled-components";


export const Column = styled.div`
display: flex;
flex-direction: column;
flex: 1;
overflow: hidden;
`;


export const TopRow = styled.div`
flex: 0 0 auto;
padding: 5px 0;
overflow: hidden;
`;

export const BottomRow = styled.div`
flex: 20;
overflow: hidden;
`;



/**
 * Outer wrapper.
 * Provides a full width and height flex container that will host
 *    - NavBar (top bar)
 *    - AppBody or NonFlexBody
 *    - Footer
 * */
export const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-height: 100vh;
`;

// -----------------------------------

export const NonFlexBody = styled.div`
  flex: 1;
  overflow: hidden;
`;

export const AppBody = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

export const AppFooter = styled.div`
  flex: 0 0 auto;
  background: silver;
`;

// -----------------------------------

/**
 * Left column, non-scrolling, hosting the search bar and rule list
 */
export const LeftColumn = styled.div`
  flex: 0 0 20em;
  max-width: 40em;
  border-right: 1px solid rgba(0, 0, 0, 0.125);
  overflow-y: hidden;
`;

/**
 * Scrollable container, hosting the list of rules
 */
export const RuleListContainer = styled.div`
  overflow-y: auto;
  height: 100%
`;

/**
 * Flex container positioned right of the 'LeftColumn'.
 * Can be used to host one or more columns.
 */
export const RightColumn = styled.div`
    display: flex;
    flex: 1 1 auto;
    background: #fff;
    overflow-y: hidden;
`;

export const AppColumn2 = styled.div`
  flex: 0 0 20em;
  max-width: 20em;
  padding: 5px;
  border-right: 1px solid rgba(0, 0, 0, 0.125);
  overflow-y: hidden;
`;

export const AppColumn10 = styled.div`
  flex: 15;
  border-right: 1px solid rgba(0, 0, 0, 0.125);
  overflow-y: auto;
  padding: 5px;
`;





export const AppContent = styled.div`
  flex: 0 0 40em;
  max-width: 40em;
  background: #fff;
  padding: 5px;
  overflow-y: auto;
  min-height: 0px;
  border-right: 1px solid rgba(0, 0, 0, 0.125);
`;





export const AppEditor = styled.div`
  flex: 1;
  order: 100;
  padding: 5px;
  overflow-y: auto;
  min-height: 0px;
`;

export const Title = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px;
  font-size: 110%;
`;

export const Container = styled.div`
  padding: 10px;
`;

export const HorizontalContainer = styled.div`
  display: flex;
  flex-direction: row;
  padding: 10px;
  justify-content: space-between;
  align-items: center;
`;

export const Header = styled.div`
  font-size: 120%;
  font-weight: 600;
`;

