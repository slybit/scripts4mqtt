import styled from "styled-components";

export const AppContainer = styled.div`
  display: flex;
  min-height: 100vh;
  flex-direction: column;
`;

export const AppBody = styled.div`
  display: flex;
  flex: 1;
`;

export const AppContent = styled.div`
  flex: 1;
  background: #fff;
  padding: 5px;
`;

export const AppNav = styled.div`
  flex: 0 0 20em;
  max-width: 40em;
  order: -1;
  border-right: 1px solid rgba(0, 0, 0, 0.125);
`;


export const Title = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px;
  font-size: 130%;
`;

export const Container = styled.div`  
  border: 1px solid #0000DD;
  background: #e9e9e9;
  padding: 2px;
  margin: 8px;
`;

