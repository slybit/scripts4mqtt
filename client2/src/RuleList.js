import React from "react";
import Icon from '@mdi/react'
import { mdiDelete, mdiCheckboxBlankOutline, mdiCheckBoxOutline } from '@mdi/js'
import { HorizontalContainer } from "./containers";
//import { Accordion, AccordionItem } from 'react-sanfona';
/*import {
    Accordion,
    AccordionItem,
    AccordionItemHeading,
    AccordionItemButton,
    AccordionItemPanel,
} from 'react-accessible-accordion';
import 'react-accessible-accordion/dist/fancy-example.css';
*/
import { Collapse, Button, CardBody, Card } from 'reactstrap';


const pushRightStyle = {
    float: 'right',
    cursor: 'pointer'
};

const selectedStyle = {
    color: 'blue',
    background: 'ALICEBLUE'
};

export class RuleList extends React.Component {

    constructor(props) {
        super(props);
    }

    handleDeleteClick = (e, key) => {
        e.stopPropagation();
        this.props.onDeleteClick(key);
    }

    handleEnableClick = (e, index, newEnabledState) => {
        e.stopPropagation();
        this.props.onEnableClick(index, newEnabledState);
    }



    render() {


        return (
            Object.keys(this.props.data).sort().map(item => {
                return (
                    <div>
                        <HorizontalContainer style={{width: "100%", background: "#007bff", color: "white", cursor: 'pointer'}} onClick={() => this.props.onCategoryClick(item)}>{item}</HorizontalContainer>
                        <Collapse isOpen={this.props.data[item].isOpen}>
                            <ul className="list-group">
                                {this.props.data[item].rules.map(rule => {
                                    const style = {
                                        cursor: 'pointer',
                                        padding: '10px 5px',
                                        ...(rule.key === this.props.selectedRule ? selectedStyle : null)
                                    }

                                    return (
                                        <li className={`list-group-item ${rule.enabled ? "bold" : ""}`} key={rule.key} id={rule.key} style={style} onClick={() => { this.props.onClick(rule.key); }}>
                                            <Icon path={rule.enabled ? mdiCheckBoxOutline : mdiCheckboxBlankOutline} className="editIcon" size={1} onClick={(e) => this.handleEnableClick(e, rule.key, !rule.enabled)} />
                                            {' '}{rule.name}
                                            <span style={pushRightStyle}>
                                                <Icon path={mdiDelete} size={1} className="deleteIcon" onClick={(e) => this.handleDeleteClick(e, rule.key)} />
                                            </span>
                                        </li>
                                    )
                                })
                                }
                            </ul>
                        </Collapse>
                    </div>
                )
            })
        );




    }
}
