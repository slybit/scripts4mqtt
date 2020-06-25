import React, { useState, useEffect } from "react";

import Sortly, { useDrag, useDrop, useIsClosestDragging, findDescendants, remove } from 'react-sortly';
import { HorizontalContainer, AppColumn10, RightColumn, AppEditor, Header } from "./containers";
import { Button, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem, InputGroup, InputGroupAddon, Input, FormGroup, Label } from 'reactstrap';
import Icon from '@mdi/react'
import { mdiPencilOutline, mdiCancel, mdiCheck } from '@mdi/js'
import update from 'immutability-helper';
//import ReactJson from 'react-json-view';
//import format from 'string-format';
import { addIds, stripIds, flattenConditions, buildTree, staticData, isNewItem } from './utils';
import { DynamicEditor } from './DynamicEditor'
import axios from 'axios';


const cache = {};

const RuleEditor = (props) => {

    const [data, setData] = useState({
        id: undefined,
        name: "",
        ontrue: [],
        onfalse: [],
        flatConditions: [],
        edData: { visible: false }
    });



    useEffect(() => {
        fetchData(props.id);
    }, [props]);


    /* ---------------------------------------------------------------------------------------------------------------
    API interactions
    --------------------------------------------------------------------------------------------------------------- */

    const fetchData = async (id) => {
        console.log('fetchData');
        //const _cache = cache;
        try {
            const response = await axios.get('/api/rule/' + id);
            // update the state
            if (response.data.success) {
                setData({
                    ...data,
                    ...response.data.rule,
                    edData: { visible: false },
                    flatConditions: flattenConditions(response.data.rule.condition),
                    ontrue: response.data.rule.ontrue ? addIds(response.data.rule.ontrue) : [],
                    onfalse: response.data.rule.onfalse ? addIds(response.data.rule.onfalse) : [],
                    nameHasChanged: false,
                    descriptionHasChanged: false,
                    categoryHasChange: false
                });
                cache['namePrev'] = response.data.rule.name;
                cache['descriptionPrev'] = response.data.rule.description;
                cache['categoryPrev'] = response.data.rule.category;
            } else {
                // TODO: alert user, editor is not visible!
                console.log(response.data);
            }
        } catch (e) {
            // TODO: alert user
            console.log(e);
        }
    };


    const pushUpdate = async (itemUpdate, updateFn) => {
        if (itemUpdate) {
            try {
                const response = await axios.put('/api/rule/' + data.id, itemUpdate);
                if (response.data.success) {
                    updateFn(response.data.rule);
                } else {
                    // TODO: alert user, editor is not visible!
                    console.log(response.data);
                }
            } catch (err) {
                console.log(err);
            }
        }
    }

    const pushConditionsUpdate = (newConditions) => {
        pushUpdate(newConditions, (newdata) => {
            setData(update(data, {
                condition: { $set: newdata.condition },
                flatConditions: { $set: flattenConditions(newdata.condition) },
                edData: {
                    visible: { $set: false },
                    alertVisible: { $set: false },
                    itemIndex: { $set: -1 }
                }
            }));
        });
    }

    const pushActionsUpdate = (itemType, newActions) => {
        pushUpdate(newActions, (newdata) => {
            setData(update(data, {
                [itemType]: { $set: newdata[itemType] ? addIds(newdata[itemType]) : [] },
                edData: {
                    visible: { $set: false },
                    alertVisible: { $set: false },
                    itemIndex: { $set: -1 }
                }
            }));
        });
    }


    /* ---------------------------------------------------------------------------------------------------------------
    Sortly functions
    --------------------------------------------------------------------------------------------------------------- */

    const handleSortlyChange = (items) => {
        for (let index = 0; index < items.length; index += 1) {
            if (!(items[index].type === 'or' || items[index].type === 'and') && findDescendants(items, index).length > 0)
                return;
        }
        setData({ ...data, flatConditions: items });
    }


    /* ---------------------------------------------------------------------------------------------------------------
    Inline editor functions for direct editing of items in the Rule View (outside of the dynamic editor)
    --------------------------------------------------------------------------------------------------------------- */

    // called when the user edits the data in the name/description input field
    // itemName is either "name" or "description"
    const onEditableItemChange = (e, itemName) => {
        setData(update(data, {
            [itemName]: { $set: e.target.value },
            [itemName + "HasChanged"]: { $set: true }
        }));
    };

    // called when the user cancels the edit of the name/description input
    // itemName is either "name" or "description"
    const handleEditableItemCancelClick = (itemName) => {
        setData(update(data, {
            [itemName]: { $set: cache[itemName + "Prev"] },
            [itemName + "HasChanged"]: { $set: false }
        }));
    };

    // called when the user commits the edit of the name/description input
    // itemName is either "name" or "description"
    const handleEditableItemSaveClick = (itemName) => {
        // push the update and update the state on success
        pushUpdate({ [itemName]: data[itemName] }, (newdata) => {
            setData(update(data, {
                [itemName + "HasChanged"]: { $set: false },
                [itemName]: { $set: newdata[itemName] }
            }));
            cache[itemName + "Prev"] = newdata[itemName];
            // call the refreshNames function of the parent Editor component to update its list of rules
            if (itemName === 'name' || itemName === 'category') props.refreshNames();
        });
    }


    /* ---------------------------------------------------------------------------------------------------------------
    Dynamic editor functions
    --------------------------------------------------------------------------------------------------------------- */

    // called when the user clicks on the 'edit' button of a condition or action
    const handleEditableItemClick = (majorType, index, itemType, model) => {
        console.log(majorType);
        console.log(index);
        console.log(itemType);
        console.log(model);

        const edData = {
            visible: true,
            data: data[itemType][index],        // copy of data we could also access using the pointers
            model: model,
            itemIndex: index,
            itemType: itemType,
            title: staticData[majorType][data[itemType][index].type],           // copy of data we could also access using the pointers
            alertVisible: false
        }

        console.log(edData);

        setData(update(data, {
            edData: { $set: edData }
        }));

    };

    const editorHandleCancelClick = () => {
        setData(update(data, {
            edData: {
                visible: { $set: false },
                alertVisible: { $set: false },
                itemIndex: { $set: -1 }
            }
        }));
    };

    const editorHandleDeleteClick = () => {
        let itemUpdate = undefined;
        let itemType = data.edData.itemType;
        if (itemType === 'flatConditions') {
            const children = findDescendants(data.flatConditions, data.edData.itemIndex);
            if (children.length === 0 || (children.length > 0 && window.confirm('Delete this logic block together with its children?'))) {
                itemUpdate = { condition: buildTree(remove(data.flatConditions, data.edData.itemIndex)) };
                pushConditionsUpdate(itemUpdate);
            }
            //this.setState({ editorAlertMessage: response.data.message, editorAlertVisible: true });
        } else {
            itemUpdate = {
                [itemType]: stripIds(
                    update(data[itemType], { $splice: [[data.edData.itemIndex, 1]] })
                )
            };
            pushActionsUpdate(itemType, itemUpdate);
        }


    };
    const editorHandleSaveClick = async (dataUpdate) => {
        let itemType = data.edData.itemType;
        // first let server validate
        try {
            let response = await axios.post('/api/validate/', { editorItemType: itemType, ...dataUpdate });
            if (!response.data.success) {
                //this.setState({ editorAlertMessage: response.data.message, editorAlertVisible: true });
                console.log(response.data);
            } else {
                let itemUpdate = undefined;
                // inject the update in a clone of the state
                const cloned = update(data[itemType],
                    { [data.edData.itemIndex]: { $set: dataUpdate } }
                )
                if (itemType === 'flatConditions') {
                    itemUpdate = { condition: buildTree(cloned) };
                    pushConditionsUpdate(itemUpdate);
                } else {
                    itemUpdate = { [itemType]: stripIds(cloned) };
                    pushActionsUpdate(itemType, itemUpdate);
                }
            }
        } catch (error) {
            // TODO: alert user
            console.log(error);
        };
    };



    /* ---------------------------------------------------------------------------------------------------------------
    Various
    --------------------------------------------------------------------------------------------------------------- */


    // Called when the user either add new condition or action
    // itemType: ontrue, onfalse, flatConditions
    // subType: either one of the action types or condition types

    const addNewItem = async (itemType, subType) => {
        // build the update and update the state on succes
        let itemUpdate = undefined;

        if (itemType === 'flatConditions') {
            let newItem = staticData.newItems.condition[subType];
            if (subType === "or")
                newItem = { type: "or", condition: [] };
            else if (subType === "and")
                newItem = { type: "and", condition: [] };
            itemUpdate = { condition: buildTree(stripIds(data.flatConditions)).concat(newItem) };
            pushConditionsUpdate(itemUpdate);
        } else {
            const newItem = staticData.newItems.action[subType];
            itemUpdate = { [itemType]: stripIds(data[itemType]).concat(newItem) };
            pushActionsUpdate(itemType, itemUpdate);
        }
    };



    /* ---------------------------------------------------------------------------------------------------------------
    UI elements
    --------------------------------------------------------------------------------------------------------------- */

    const newConditions = Object.keys(staticData.newItems.condition).map((condition) => (
        <DropdownItem key={condition} onClick={() => { addNewItem("flatConditions", condition) }}>{staticData.conditions[condition]}</DropdownItem>
    ));

    const newOntrueActions = Object.keys(staticData.newItems.action).map((action) => (
        <DropdownItem key={action} onClick={() => { addNewItem("ontrue", action) }}>{staticData.actions[action]}</DropdownItem>
    ));

    const newOnfalseActions = Object.keys(staticData.newItems.action).map((action) => (
        <DropdownItem key={action} onClick={() => { addNewItem("onfalse", action) }}>{staticData.actions[action]}</DropdownItem>
    ));

    const categoryDatalist = props.categories.map((category) => (
        <option key={category} value={category} label={category}/>
    ));

    /* ---------------------------------------------------------------------------------------------------------------
    Main render
    --------------------------------------------------------------------------------------------------------------- */

    return (
        <RightColumn>

            <AppColumn10>
                <FormGroup>
                    <Label for="name">Name</Label>
                    <InputGroup name="name">
                        <Input className="bold_blue" value={data.name || ""} onChange={(e) => onEditableItemChange(e, "name")} />
                        {data.nameHasChanged && <InputGroupAddon addonType="append">
                            <Button color="secondary"><Icon path={mdiCheck} size={1} color="white" onClick={() => handleEditableItemSaveClick("name")} /></Button>
                            <Button color="secondary"><Icon path={mdiCancel} size={1} color="white" onClick={() => handleEditableItemCancelClick("name")} /></Button>
                        </InputGroupAddon>}
                    </InputGroup>
                </FormGroup>
                <FormGroup>
                    <Label for="category">Category</Label>
                    <InputGroup name="category">
                        <Input value={data.category} list="categories"  onChange={(e) => onEditableItemChange(e, "category")} />
                        <datalist id="categories">
                            {categoryDatalist}
                        </datalist>
                        {data.categoryHasChanged && <InputGroupAddon addonType="append">
                            <Button color="secondary"><Icon path={mdiCheck} size={1} color="white" onClick={() => handleEditableItemSaveClick("category")} /></Button>
                            <Button color="secondary"><Icon path={mdiCancel} size={1} color="white" onClick={() => handleEditableItemCancelClick("category")} /></Button>
                        </InputGroupAddon>}
                    </InputGroup>
                </FormGroup>
                <FormGroup>
                    <Label for="description">Description</Label>
                    <InputGroup name="description">
                        <Input type="textarea" value={data.description} onChange={(e) => onEditableItemChange(e, "description")} />
                        {data.descriptionHasChanged && <InputGroupAddon addonType="append">
                            <Button color="secondary"><Icon path={mdiCheck} size={1} color="white" onClick={() => handleEditableItemSaveClick("description")} /></Button>
                            <Button color="secondary"><Icon path={mdiCancel} size={1} color="white" onClick={() => handleEditableItemCancelClick("description")} /></Button>
                        </InputGroupAddon>}
                    </InputGroup>
                </FormGroup>

                <HorizontalContainer>
                    <Header>Conditions:</Header>
                    <UncontrolledDropdown>
                        <DropdownToggle caret>
                            Add Condition
                            </DropdownToggle>
                        <DropdownMenu>
                            <DropdownItem header>Logical</DropdownItem>
                            <DropdownItem onClick={() => { addNewItem("flatConditions", "or") }}>OR</DropdownItem>
                            <DropdownItem onClick={() => { addNewItem("flatConditions", "and") }}>AND</DropdownItem>
                            <DropdownItem divider />
                            <DropdownItem header>Condition</DropdownItem>
                            {newConditions}
                        </DropdownMenu>
                    </UncontrolledDropdown>
                </HorizontalContainer>

                {
                    data.flatConditions.length > 0 && <Sortly
                        items={data.flatConditions}
                        onChange={handleSortlyChange} >
                        {(props) => <ConditionItemRenderer {...props} onEditableItemClick={handleEditableItemClick} />}
                    </Sortly>
                }

                <HorizontalContainer>
                    <Header>On True:</Header>
                    <UncontrolledDropdown>
                        <DropdownToggle caret>
                            Add OnTrue Action
                            </DropdownToggle>
                        <DropdownMenu>
                            {newOntrueActions}
                        </DropdownMenu>
                    </UncontrolledDropdown>
                </HorizontalContainer>
                <ul className="list-group">
                    <ActionItemRenderer
                        actions={data.ontrue}
                        type="ontrue"
                        onEditableItemClick={handleEditableItemClick}
                    />
                </ul>

                <HorizontalContainer>
                    <Header>On False:</Header>
                    <UncontrolledDropdown>
                        <DropdownToggle caret>
                            Add OnFalse Action
                            </DropdownToggle>
                        <DropdownMenu>
                            {newOnfalseActions}
                        </DropdownMenu>
                    </UncontrolledDropdown>
                </HorizontalContainer>
                <ul className="list-group">
                    <ActionItemRenderer
                        actions={data.onfalse}
                        type="onfalse"
                        onEditableItemClick={handleEditableItemClick}
                    />
                </ul>




            </AppColumn10>
            {
                false && <AppColumn10>
                    {<pre className='code'>{JSON.stringify(data, undefined, 4)}</pre>}
                </AppColumn10>
            }

            <AppColumn10>
                {data.edData.visible && <DynamicEditor
                    visible={data.edData.visible}
                    editorData={data.edData.data}
                    title={data.edData.title}
                    model={data.edData.model}
                    key={data.edData.data._id}
                    alertVisible={data.edData.alertVisible}
                    alert={data.edData.alertMessage}
                    onHandleSaveClick={editorHandleSaveClick}
                    onHandleCancelClick={editorHandleCancelClick}
                    onHandleDeleteClick={editorHandleDeleteClick} />
                }
            </AppColumn10>



        </RightColumn >
    );

}

/* --------------------------------------------------------------------------------------------------------------------
  Styles
-------------------------------------------------------------------------------------------------------------------- */


const itemStyle = {
    border: '1px solid #ccc',
    cursor: 'move',
    padding: 10,
    marginBottom: 4
};

const muteStyle = {
    //opacity: .5,
    boxShadow: '0px 0px 8px #666',
    border: '1px dashed #1976d2',
}

const newStyle = {
    background: '#e8ffbc',
    color: 'green',
    fontWeight: 600,
}

const pushRightStyle = {
    float: 'right',
    cursor: 'pointer'
};



/* --------------------------------------------------------------------------------------------------------------------
  Condition and Action item renderers
-------------------------------------------------------------------------------------------------------------------- */



const ConditionItemRenderer = (props) => {

    const { data, index, onEditableItemClick } = props;
    const [{ isDragging }, drag] = useDrag({
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });
    const [, drop] = useDrop({
        drop() { console.log('drop') }

    });


    const handleClick = async () => {
        // on the fly add in data to the model
        let model = staticData.editor.condition[data.type];
        if (data.type === 'alias') {
            try {
                let response = await axios.get('/api/aliases');
                if (response.data.success) {
                    let aliasModel = model.find((item) => (item.key === 'alias'));
                    aliasModel.options = [{ value: "__REPLACE__", label: "(none)" }];
                    for (let alias in response.data.aliases) {
                        aliasModel.options.push({ value: alias, label: alias });
                    }
                } else {
                    console.log("Error returned by the server: " + response.data.message);
                }
            } catch (error) {
                console.log("Cannot access the script4mqtt service. " + error);
            }
        }
        onEditableItemClick("conditions", index, "flatConditions", model);
    };





    let label = "";
    let isNew = false;
    switch (data.type) {
        case "and":
            label = "AND"
            break;
        case "or":
            label = "OR";
            break;
        case "mqtt":
            isNew = isNewItem(data, "condition", data.type);
            const { topic } = data;
            label = `MQTT [${topic}]`;
            break;
        case "alias":
            isNew = isNewItem(data, "condition", data.type);
            const { alias } = data;
            label = `ALIAS [${alias}]`;
            break;
        case "cron":
            isNew = isNewItem(data, "condition", data.type);
        default:
            label = staticData.conditions[data.type];
            break;
    }

    if (isNew) {
        label = "* " + label;
    }

    const style = {
        ...itemStyle,
        ...(useIsClosestDragging() || isDragging ? muteStyle : null),
        ...(isNew ? newStyle : null),
        marginLeft: data.depth * 30,
    };

    return (
        <div ref={drop}>
            <div ref={drag} style={style}>{label}
                <span style={pushRightStyle}>
                    <Icon path={mdiPencilOutline} size={1} className="editIcon" onClick={handleClick} />
                </span>
            </div>
        </div>
    );

}


const ActionItemRenderer = (props) => {

    const ontrueActions = props.actions.map((action, index) => {
        const isNew = isNewItem(action, "action", action.type);
        const style = {
            cursor: 'pointer',
            ...(isNew ? newStyle : null)
        };
        return (
            <li className="list-group-item"
                key={action._id} id={action._id}
                style={style}
                onClick={() => props.onEditableItemClick("actions", index, props.type, staticData.editor.action[action.type])}>
                {isNew ? "* " : ""} {staticData.actions[action.type]}
            </li>
        )
    });

    return ontrueActions;

}



/* --------------------------------------------------------------------------------------------------------------
Memoize our RuleEditor, such as that it does NOT get update anymore, unless we change rule by clicking
another rule in the RuleList (Editor).
-------------------------------------------------------------------------------------------------------------- */

function ruleEditorPropsAreEqual(prevRuleEditor, nextRuleEditor) {
    return prevRuleEditor.id === nextRuleEditor.id;
}

export const MemoizedRuleEditor = React.memo(RuleEditor, ruleEditorPropsAreEqual);




