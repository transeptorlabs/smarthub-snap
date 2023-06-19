import Blockies from 'react-blockies';
import styled from 'styled-components';

const BlockieContainer = styled.div`
    .identicon {
        border-radius: 50%;
        width: 100%;
        height: 100%;
        margin-right: 1rem;
        background-size: cover;
        background-repeat: no-repeat;
        background-position: center;
        border: 1px solid ${({ theme }) => theme.colors.border.default};
    }
`;

export const BlockieEoa = () => (
    <BlockieContainer>
        <Blockies
            seed="Jeremy"
            size={12} 
            scale={4}
            bgColor='#907aa8'
            spotColor="#abc" 
            className="identicon"
        />
    </BlockieContainer>   
)

export const BlockieSc = () => (
    <BlockieContainer>
        <Blockies
            seed="Jeremy"
            size={12} 
            scale={4}
            bgColor='#8d15bd'
            spotColor="#abc" 
            className="identicon"
        />
    </BlockieContainer>   
)