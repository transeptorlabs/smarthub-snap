import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

const ModalWrapper = styled.div`

  position: fixed;
  display: flex;
  justify-content: center;
  align-items: center;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: flex-end; 
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: ${({ theme }) => theme.colors.background.default};
  position: absolute;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2);
`;

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  buttonRef?: React.RefObject<HTMLButtonElement>;
  top?: number;
  right?: number;
};

export const Modal = ({
    isOpen, 
    onClose, 
    children,
    buttonRef,
    top,
    right,
}: ModalProps) => {

    const modalContentRef = useRef<HTMLDivElement>(null);
    const [modalPosition, setModalPosition] = useState({ top: 0, right: 0 });

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (modalContentRef.current && !modalContentRef.current.contains(event.target as Node)) {
                onClose();
            }    
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleOutsideClick);
        }

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen && buttonRef && buttonRef.current) {
            const buttonRect = buttonRef.current.getBoundingClientRect();
            const newTop = buttonRect.bottom;
            const newRight = buttonRect.right - buttonRect.width;
            setModalPosition({ top: top ? top : newTop, right: right ? right : newRight });
        }
    }, [isOpen, buttonRef]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }

        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
        document.body.style.overflow = 'hidden';
        } else {
        document.body.style.overflow = 'auto';
        }

        return () => {
        document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    return (
    <ModalWrapper>
        <ModalContent style={{ ...modalPosition }} ref={modalContentRef}>
        {children}
        </ModalContent>
    </ModalWrapper>
    );
};