import styled from "styled-components";

export const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  max-height: 100vh;
  flex-direction: column;
`;

// -----------------------------------

export const AppBody = styled.div`
  display: flex;
  flex: 1 1 auto;
  height: 80%;
`;

export const AppFooter = styled.div`
  height: 200px;
  resize: vertical;
  overflow: auto;
`;

// -----------------------------------

export const AppNav = styled.div`
  flex: 0 0 20em;
  max-width: 40em;
  order: -1;
  border-right: 1px solid rgba(0, 0, 0, 0.125);
  overflow-y: auto;
    min-height: 0px;
`;

export const AppMain = styled.div`
    display: flex;
    flex: 1 1 auto;
    background: #fff;
    padding: 5px;
    overflow-y: auto;
    min-height: 0px;
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
  font-weight: 800;
`;

