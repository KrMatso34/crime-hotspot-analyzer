import React, { useState } from 'react';
import { 
	DndContext, 
	closestCenter, 
	KeyboardSensor, 
	PointerSensor, 
	useSensor, 
	useSensors 
} from '@dnd-kit/core';
import { 
	arrayMove, 
	SortableContext, 
	sortableKeyboardCoordinates, 
	verticalListSortingStrategy, 
	useSortable 
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';

import { AddressAutocompleteDropdown } from '../AddressAutocompleteDropdown/AddressAutocompleteDropdown';

import clsx from 'clsx';
import styles from './AddressListInput.module.css'

function SortableItem({ item, onRemove, onEdit, showDelete, label }) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging
	} = useSortable({ id: item.id });

	const [isFocused, setIsFocused] = useState(false);
	const [isAutofillOpen, setIsAutofillOpen] = useState(false);

	const style = {
		backgroundColor: isDragging ? '#263B4A' : '#456C86',
		transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
		transition,
	};

	return (
		<div ref={setNodeRef} style={style} className={styles.addressInputRow} {...attributes}>
			<button
				{...listeners}
			>
				☰
			</button>

			<div className={clsx(styles.addressInputWrapper)}>
				<input
					type="text"
					className={clsx(styles.addressInput)}
					value={item.content}
					onChange={(e) => onEdit(item.id, e.target.value)}
					onFocus={() => {setIsFocused(true); setIsAutofillOpen(true)}}
					onBlur={() => setIsFocused(false)}
					placeholder={label}
				/>
				<AddressAutocompleteDropdown
					query={item.content}
					setQuery={(newQuery) => onEdit(item.id, newQuery)}
					isOpen={isAutofillOpen}
					setIsOpen={setIsAutofillOpen}
				/>
			</div>
			

			{showDelete && <button
				type="button"
				onClick={() => onRemove(item.id)}
				className={clsx(
					styles.deleteButton,
					isFocused ? styles.focused : ''
				)}
			>
				✕
			</button>
			}
		</div>
	);
}


export function AddressListInput({ items, setItems }) {

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	const handleAddItem = (e) => {
		e.preventDefault();

		const newItem = {
			id: `item-${Date.now()}`,
			content: ''
		};

		setItems([...items, newItem]);
	};

	const handleRemoveItem = (idToRemove) => {
		if (items.length <= 2) return;
		setItems(items.filter(item => item.id !== idToRemove));
	};

	const handleEditItem = (idToEdit, newContent) => {
		setItems(
			items.map((item) => 
				item.id === idToEdit ? { ...item, content: newContent } : item
			)
		);
	};

	const handleDragEnd = (event) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			setItems((prevItems) => {
				const oldIndex = prevItems.findIndex((item) => item.id === active.id);
				const newIndex = prevItems.findIndex((item) => item.id === over.id);
				return arrayMove(prevItems, oldIndex, newIndex);
			});
		}
	};

	return (
		<div className={clsx(styles.addressListContainer)}>
			<DndContext 
				sensors={sensors} 
				collisionDetection={closestCenter} 
				onDragEnd={handleDragEnd}
				modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
			>
				<SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
					<div>
						{items.map((item, index) => {
							let label = `Stop ${index}`;
							if (index == 0) label = 'Origin';
							else if (index == items.length-1) label = 'Destination';
							return <SortableItem 
								key={item.id} 
								item={item} 
								onRemove={handleRemoveItem}
								onEdit={handleEditItem}
								showDelete={items.length > 2}
								label={label}
							/>
						})}
					</div>
				</SortableContext>
			</DndContext>

			<form onSubmit={handleAddItem}>
				<button>
					Add Stop
				</button>
			</form>
		</div>
	);
}