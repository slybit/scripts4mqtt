import React, { Children, useLayoutEffect } from 'react';

import Icon from '@mdi/react'
import { mdiCheckboxBlankOutline, mdiCheckBoxOutline, mdiCancel, mdiCheck, mdiDelete, mdiHexagon, mdiTimer, mdiMessageText, mdiFlash } from '@mdi/js'
import Item from 'react-sortly/lib/Item';

const trueStyle = {
    color: 'LimeGreen'
}

const falseStyle = {
    color: 'silver'
}

const actionStyle = {
    color: 'orange'
}


function Bookmark(props) {
    const { data, className, children, ...restProps } = props;
    return (
        <li {...restProps} className={`timeline-item ${className}`}>
            {children}
        </li>
    );
}


/*

{(item.subtype === "cron") &&
                                <div>
                                    <Icon path={mdiTimer} size={0.7} style={item.state === "true" ? { ...trueStyle } : { ...falseStyle }}/> {(new Date(item.timestamp).toLocaleString())}
                                </div>
                            }
                            {(item.subtype === "mqtt") &&
                                <div>
                                    <Icon path={mdiMessageText} size={0.7} style={item.state === "true" ? { ...trueStyle } : { ...falseStyle }}/> {(new Date(item.timestamp).toLocaleString())}
                                    <br></br>
                                    {item.topic}
                                </div>
                            }
*/
function Event(props) {
    const { data, ...restProps } = props;

    let className = 'timeline-item-left';
    let icon = '';
    let iconStyle = falseStyle;
    let details = '';

    switch (data.type) {
        case 'action':
            className = 'timeline-item-right';
            icon = mdiFlash;
            iconStyle = actionStyle;
            details = <><br></br>{data.state ? 'On True' : 'On False'}</>;
            break;
        case 'condition':
            switch (data.subtype) {
                case 'mqtt':
                    icon = mdiMessageText;
                    details = <><br></br>{data.topic}</>;
                    break;
                case 'cron':
                    icon = mdiTimer;
                    break;
            }
            iconStyle = data.state === "true" ? trueStyle : falseStyle;
            break;
    }


    return (
        <li className={`timeline-item ${className}`}>
            <div>
                <Icon path={icon} size={0.7} style={{...iconStyle}} /> {(new Date(data.timestamp).toLocaleString())}
                <br></br>
                {details}
            </div>
        </li>
    );
}


function Timeline(props) {
    const { className, tip = true, children } = props;
    const tipClassName = tip ? 'with-tip' : '';
    const fullClassName = `timeline-wrapper ${tipClassName} ${className || ''}`;
    const numBookmarks = Children.count(children);

    useLayoutEffect(() => {
        let css = '';
        for (let i = 1; i <= numBookmarks; i += 1) {
            css += `.timeline-item:nth-child(${i}) {grid-row: ${i};}`;
        }

        document.head.insertAdjacentHTML(
            'beforeend',
            `<style data-timeline-styles>${css}</style>`
        );

        return () => {
            document.querySelector('[data-timeline-styles]').remove();
        };
    }, [numBookmarks]);

    return (
        <div className={fullClassName}>
            <div className="timeline-connector" />
            <ul className="timeline">
                {children}
                {Array(numBookmarks)
                    .fill()
                    .map((_, i) => (
                        <span key={i} className="timeline-dotmark">
                            <div className="timeline-square" />
                        </span>
                    ))}
            </ul>
        </div>
    );
}

export { Timeline, Bookmark, Event };
