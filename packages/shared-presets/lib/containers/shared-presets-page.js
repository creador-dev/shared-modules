import React from 'react';
import styled from 'styled-components';

import { Box, BoxHeader, BoxBody, BoxFooter } from '@wpmudev/react-box';
import { Notifications } from '@wpmudev/react-notifications';
import { Button } from '@wpmudev/react-button';

import ApplyModal from '../components/apply-modal';
import DeleteModal from '../components/delete-modal';
import EditModal from '../components/edit-modal';
import { PresetsAccordionItem } from '../components/accordion-item';

import Requester from '../requests-handler';

const LoadingContent = styled.div`
.sui-wrap && {
    position: relative;
    z-index: 2;
}
`;

const LoadingWrap = styled.div`
.sui-wrap && {
    pointer-events: none;
}`;

const LoadingMask = styled.div`
.sui-wrap && {
    width: 100%;
    height: 100%;
    display: flex;
    flex-flow: row wrap;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 0;
    left: 0;
    background-color: rgba(255,255,255,0.95);
    border-radius: 0 0 4px 4px;

    > p {

    }
}
`;

const StyledSyncButton = styled.button`
.sui-wrap && {
	color: #17A8E3;
	font-weight: 500;
	background-color: transparent;
	border: none;
	cursor: pointer;
	text-decoration: underline;
	display: inline;
	margin: 0;
	padding: 0;
}
`;

let RequestsHandler;

export const PresetsPage = ( {
	isPro,
	isWhitelabel,
	requestsData,
	sourceUrls,
	sourceLang
} ) => {
	const [ configs, setConfigs ] = React.useState( [] );
	const [ isLoading, setIsLoading ] = React.useState( true );

	// Modals-related states.
	const [ currentConfig, setCurrentConfig ] = React.useState( null );
	const [ isApplyOpen, setIsApplyOpen ] = React.useState( false );
	const [ isDeleteOpen, setIsDeleteOpen ] = React.useState( false );
	const [ isEditOpen, setIsEditOpen ] = React.useState( false );

	const urls = Object.assign(
		{
			freeNoticeHub: 'https://wpmudev.com/hub-welcome/',
			hubMyConfigs: 'https://wpmudev.com/hub2/configs/my-configs',
			accordionImg: null,
		},
		sourceUrls
	);

	const lang = Object.assign(
		{
			title: 'Preset configs',
			upload: 'Upload',
			save: 'Save config',
			loading: 'Updating the config list…',
			emptyNotice: 'You don’t have any available config. Save preset configurations of your settings, then upload and apply them to your other sites in just a few clicks!',
			baseDescription: 'Use configs to save preset configurations of your settings, then upload and apply them to your other sites in just a few clicks!',
			proDescription: (
				<>
					{'You can easily apply configs to multiple sites at once via '}
					<a
						href={urls.hubMyConfigs}
						target="_blank"
						rel="noreferrer"
					>
					{'the Hub.'}
					</a>
				</>
			),
			syncWithHubText: 'Created or updated the configs via the Hub?',
			syncWithHubButton: 'Re-check to get the updated list.',
			apply: 'Apply',
			download: 'Download',
			edit: 'Name and Description',
			delete: 'Delete',
			freeNoticeMessage: 'Tired of saving, downloading and uploading your configs across your sites? WPMU DEV members use The Hub to easily apply configs to multiple sites at once… Try it free today!',
			freeButtonLabel: 'Try The Hub',
			notificationDismiss: 'Dismiss notice',
			defaultRequestError: 'Request failed. Status: {status}. Please reload the page and try again.',
			uploadActionSuccessMessage: '{configName} config has been uploaded successfully – you can now apply it to this site.',
			applyAction: {
				successMessage: '{configName} config has been applied successfully.',
			},
			editAction: {
				successMessage: '{configName} config created successfully.',
			},
			deleteAction: {},
			settingsLabels: {},
		},
		sourceLang
	);

	React.useEffect(() => {
		RequestsHandler = new Requester( requestsData );
		retrieveConfigs();
	}, []);

	const retrieveConfigs = () => {
		setIsLoading( true );

		RequestsHandler.makeLocalRequest()
			.then( ( newConfigs ) => setConfigs( newConfigs || [] ) )
			.catch( ( res ) => requestFailureNotice( res ) )
			.then( () => setIsLoading( false ) );
	};

	const handleUpload = ( e ) => {
		let newConfigName;

		RequestsHandler.upload( e ).then( ( res ) => {
			if ( res.data && res.data.config ) {
				res.data.name = res.data.name.substring( 0, 200 );
				res.data.description = res.data.description.substring( 0, 200 );
				newConfigName = res.data.name;
				return RequestsHandler.addNew( configs, res.data );
			}

			// Throw otherwise.
			throw res;
		} )
		.then( ( updatedConfigs ) => {
			setConfigs( updatedConfigs );
			successNotice( lang.uploadActionSuccessMessage.replace( '{configName}', newConfigName ) );
		} )
		.catch( ( res ) => requestFailureNotice( res ) );
	};

	const handleDelete = () => {
		RequestsHandler.delete( [ ...configs ], currentConfig )
			.then( ( newConfigs ) => setConfigs( newConfigs ) )
			.catch( ( res ) => requestFailureNotice( res ) )
			.then( () => setIsDeleteOpen( false ) );
	};

	const handleEdit = ( data, displayErrorMessage ) => {
		const configData = {
			name: data.get( 'name' ).substring( 0, 200 ),
			description: data.get( 'description' ).substring( 0, 200 ),
		};

		// Editing a config.
		if ( currentConfig ) {
			RequestsHandler.edit( [ ...configs ], currentConfig, configData )
				.then( ( newConfigs ) => setConfigs( newConfigs ) )
				.catch( ( res ) => requestFailureNotice( res ) )
				.then( () => setIsEditOpen( false ) );

			return;
		}

		// Creating a new config.
		RequestsHandler.create( data )
			.then( ( res ) => {
				if ( res.data && res.data.config ) {
					configData.config = res.data.config;
					return RequestsHandler.addNew( [...configs], configData );
				}

				if ( ! res.success ) {
					displayErrorMessage( res.data.error_msg );
				}
			} )
			.then( ( updatedConfigs ) => {
				setConfigs( updatedConfigs );
				setIsEditOpen( false );
				successNotice( lang.editAction.successMessage.replace( '{configName}', configData.name ) );
			} )
			.catch( ( res ) => requestFailureNotice( res ) );
	};

	const handleApply = () => {
		RequestsHandler.apply( currentConfig ).then( ( res ) => {
			setIsApplyOpen( false );

			if ( ! res.success ) {
				requestFailureNotice( res );
				return;
			}
			successNotice( lang.applyAction.successMessage.replace( '{configName}', currentConfig.name ) );
		})
		.catch( ( res ) => requestFailureNotice( res ) );
	};

	const handleSyncWithHub = () => {
		setIsLoading( true );
		RequestsHandler.syncWithHub( [ ...configs ] )
			.then( ( newConfigs ) => setConfigs( newConfigs ) )
			.catch( ( res ) => requestFailureNotice( res ) )
			.then( () => setIsLoading( false ) );
	};

	const doDownload = ( clickedConfig ) => {
		const config = Object.assign( {}, configs.find( ( item ) => clickedConfig.id === item.id ) );
		if ( ! config || ! Object.keys( config ).length ) {
			return;
		}

		// This is unique per site.
		delete config.hub_id;

		// Avoid having multiple defaults on upload.
		delete config.default;

		const blob = new Blob( [ JSON.stringify( config, null, 2 ) ], {
			type: 'application/json',
		});

		const pluginName = requestsData.pluginData.name.toLowerCase().replace( ' ', '-' ),
			configName = config.name.replace( /[^a-z0-9_-]/gi, '_' ).toLowerCase(),
			url = window.URL.createObjectURL(blob),
			a = document.createElement('a');

		a.style.display = 'none';
		a.href = url;
		a.download = `wp-${ pluginName }-config-${ configName }`;
		document.body.appendChild( a );
		a.click();
		window.URL.revokeObjectURL( url );
		a.remove();
	};

	// Utils to move somewhere else.
	const successNotice = ( message ) => {
		window.SUI.openNotice('sui-configs-floating-notice', `<p>${ message }</p>`, {
			type: 'success',
			icon: 'check-tick',
			dismiss: {
				show: true,
				label: lang.notificationDismiss,
			},
		});
	};

	const requestFailureNotice = ( res ) => {
		let message;

		if ( res.data ) {
			message = res.data.error_msg;
		} else if ( res.status && 403 === res.status ) {
			message = lang.defaultRequestError.replace( '{status}', res.status );
		} else {
			window.console.log( res );
			message = 'Error. Please check the browser console';
		}

		window.SUI.openNotice('sui-configs-floating-notice', `<p>${ message }</p>`, {
			type: 'error',
			icon: 'info',
			dismiss: {
				show: true,
				label: lang.notificationDismiss,
			},
		});
	};

	// End of utils to move somewhere else.

	const isEmpty = ! configs || 0 === configs.length;

	const openModal = ( action, config ) => {
		setCurrentConfig( config );

		if ( 'apply' === action ) {
			setIsApplyOpen( true );
		} else if ( 'delete' === action ) {
			setIsDeleteOpen( true );
		} else {
			setIsEditOpen( true );
		}
	};

	const tableImage = !isWhitelabel ? urls.accordionImg : null;
	const Table = (
		<React.Fragment>
			{ !isEmpty && (
				<div
					className="sui-accordion sui-accordion-flushed"
					style={ {
						borderBottomWidth: 0
					} }
				>
					{ configs.map( item => (
						<PresetsAccordionItem
							key={ item.id }
							id={ item.id }
							default={ item.default }
							name={ item.name }
							description={ item.description }
							image={ tableImage }
							showApplyButton={ true }
							applyLabel={ lang.apply }
							applyAction={ () => openModal( 'apply', item ) }
							downloadLabel={ lang.download }
							downloadAction={ () => doDownload( item ) }
							editLabel={ lang.edit }
							editAction={ () => openModal( 'edit', item ) }
							deleteLabel={ lang.delete }
							deleteAction={ () => openModal( 'delete', item ) }
						>
							{ Object.keys( item.config.strings ).map( ( name ) => (
								<div key={ name } name={ lang.settingsLabels[ name ] } status={ item.config.strings[ name ] } />
							) ) }
						</PresetsAccordionItem>
					) ) }
				</div>
			)}
		</React.Fragment>
	);

	const Footer = (
		<React.Fragment>

			{ !isPro && (
				<BoxFooter
					display="block"
				>
					<Notifications type="upsell">
						<p>{ lang.freeNoticeMessage }</p>
						<p>
							<Button
								label={ lang.freeButtonLabel }
								color="purple"
								href={ urls.freeNoticeHub }
								target="_blank"
							/>
						</p>
					</Notifications>
				</BoxFooter>
			)}

			{ isPro && (
				<BoxFooter
					display="block"
					alignment="center"
					paddingTop={ isEmpty ? 0 : 30 }
					border={ isEmpty ? 0 : 1 }
				>
					<p className="sui-description">
						{ lang.syncWithHubText } {' '}
						<StyledSyncButton onClick={ handleSyncWithHub }>
							{ lang.syncWithHubButton }
						</StyledSyncButton>
					</p>
				</BoxFooter>
			)}

		</React.Fragment>
	);

	return (
		<React.Fragment>
			<div className="sui-floating-notices">
				<div role="alert" id="sui-configs-floating-notice" className="sui-notice" aria-live="assertive"></div>
			</div>

			<Box>
				<BoxHeader title={ lang.title }>
					<div className="sui-actions-right">
						<Button
							icon="upload-cloud"
							label={ lang.upload }
							design="ghost"
							htmlFor="sui-upload-configs-input"
						/>
						<input
							id="sui-upload-configs-input"
							type="file"
							name="config_file"
							className="sui-hidden"
							value=""
							readOnly="readonly"
							onChange={ handleUpload }
							accept=".json"
						/>
						<Button
							type="button"
							icon="save"
							label={ lang.save }
							color="blue"
							onClick={ () => openModal( 'edit', null ) }
						/>
					</div>
				</BoxHeader>

				<BoxBody>

					<p>
						{ lang.baseDescription + ' ' }
						{ isPro && !isWhitelabel &&
							lang.proDescription
						}
					</p>

					{ !isLoading && isEmpty && (
						<Notifications type="info">
							<p>{ lang.emptyNotice }</p>
						</Notifications>
					)}

				</BoxBody>

				{ isLoading && (
					<LoadingContent>
						<LoadingWrap aria-hidden="true">
							{ Table }
							{ Footer }
						</LoadingWrap>
						<LoadingMask>
							<p className="sui-description">
								<span
									className="sui-icon-loader sui-loading"
									aria-hidden="true"
									style={ { marginRight: 10 } }
								/>
								{ lang.loading }
							</p>
						</LoadingMask>
					</LoadingContent>
				)}

				{ !isLoading && (
					<React.Fragment>
						{ Table }
						{ Footer }
					</React.Fragment>
				)}

			</Box>

			{ isApplyOpen && (
				<ApplyModal
					setOpen={ setIsApplyOpen }
					config={ currentConfig }
					save={ handleApply }
					strings={ lang.applyAction }
				/>
			) }
			{ isDeleteOpen && (
				<DeleteModal
					setOpen={ setIsDeleteOpen }
					config={ currentConfig }
					save={ handleDelete }
					strings={ lang.deleteAction }
				/>
			) }
			{ isEditOpen && (
				<EditModal
					setOpen={ setIsEditOpen }
					config={ currentConfig }
					save={ handleEdit }
					strings={ lang.editAction }
				/>
			) }
		</React.Fragment>
	);
}