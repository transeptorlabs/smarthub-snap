import styled from 'styled-components';
import { FaCaretDown, FaCaretUp } from "react-icons/fa";
import { useState } from 'react';

const FaqContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: left;

  &:hover {
    color: ${({ theme }) => theme.colors.primary.main};
    cursor: pointer;
  }
`

const FlexRowWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`

const TextBold = styled.p`
  color: ${(props) => props.theme.colors.text.default};
  font-weight: bold;
  margin: 0;
  margin-bottom: 2rem;
`; 

const Text = styled.p`
  color: ${(props) => props.theme.colors.text.default};
  margin: 0;
`; 

const IconContainer = styled.div`
  margin-left: 1rem; 
`;

export const Faq = ({
    queston,
    description,
  }: {
    queston: string,
    description: string,
  }) => {

    const [faqOpen, setFaqOpen] = useState(false);

    const toggleFaq = async (event: any) => {
        event.preventDefault();
        setFaqOpen(!faqOpen)
      };

    return (
      <FaqContainer onClick={toggleFaq}>
        <FlexRowWrapper>
          <TextBold>{queston}</TextBold>
          {faqOpen ? <IconContainer><FaCaretUp /></IconContainer> : <IconContainer onClick={toggleFaq}><FaCaretDown /></IconContainer> }
        </FlexRowWrapper>
        {faqOpen && 
          <Text>{description}</Text>
        }
      </FaqContainer>
    )
}
