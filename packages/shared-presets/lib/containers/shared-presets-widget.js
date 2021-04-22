import React, { Component, Children } from 'react';
import { Box, BoxHeader, BoxBody, BoxFooter } from '@wpmudev/react-box';
import { Notifications } from '@wpmudev/react-notifications';
import { Button } from '@wpmudev/react-button';
import { PresetsAccordionItem } from '../components/accordion-item';

export class PresetsWidget extends Component {
    constructor( props ) {
        super( props );

        this.state = {
            empty: false
        }
    }

    componentDidMount() {
        const items = this.props.children;

        if ( 0 === items.length ) {
            this.setState({
                empty: true
            });
        }
    }

    render() {
        const { empty } = this.state;

        const items = Children.map( this.props.children, item => {
            return (
                <PresetsAccordionItem
                    default={ item.props.default || false }
                    title={ item.props.title }
                    description={ item.props.description }
                    image={ item.props.image }
                    applyLabel={ item.props.applyLabel }
                    applyAction={ item.props.applyAction }
                    downloadLabel={ item.props.downloadLabel }
                    editLabel={ item.props.editLabel }
                    editAction={ item.props.editAction }
                    deleteLabel={ item.props.deleteLabel }
                >
                    { item.props.children }
                </PresetsAccordionItem>
            );
        });

        return (
            <Box>

                { !empty && (
                    <BoxHeader
                        titleIcon="wrench-tool"
                        title={ this.props.title }
                        tagLabel={ this.props.children.length }
                    />
                )}

                { empty && (
                    <BoxHeader
                        titleIcon="wrench-tool"
                        title={ this.props.title }
                    />
                )}

                <BoxBody>

                    <p>{ this.props.message }</p>

                    { empty && (
                        <Notifications type="info">
                            <p>{ this.props.notice }</p>
                        </Notifications>
                    )}

                </BoxBody>

                { !empty && (
                    <div
                        className="sui-accordion sui-accordion-flushed"
                        style={ { borderBottom: 0 } }
                    >
                        { items }
                    </div>
                )}

                <BoxFooter>
                    <Button
                        icon="save"
                        label={ this.props.saveLabel }
                        color="blue"
                    />
                    <Button
                        icon="wrench-tool"
                        label={ this.props.manageLabel }
                        design="ghost"
                    />
                </BoxFooter>

            </Box>
        );
    }
}