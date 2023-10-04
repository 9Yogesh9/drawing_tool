import { MENU_ITEMS } from "@/constants";
import { actionItemClick } from "@/slice/menuSlice";
import { useEffect, useLayoutEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { socket } from "@/socket";

const Board = () => {
    const dispatch = useDispatch();
    const drawHistory = useRef([]);
    const historyPointer = useRef(0);
    const canvasRef = useRef(null);
    const shouldDraw = useRef(false);
    const { activeMenuItem, actionMenuItem } = useSelector((state) => state.menu);
    const { color, size } = useSelector((state) => state.toolbox[activeMenuItem]);

    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (actionMenuItem === MENU_ITEMS.DOWNLOAD) {
            const URL = canvas.toDataURL()
            const anchor = document.createElement('a')
            anchor.href = URL
            anchor.download = 'sketch.jpg'
            anchor.click()
        } else if (actionMenuItem === MENU_ITEMS.UNDO || actionMenuItem === MENU_ITEMS.REDO) {
            if (historyPointer.current > 0 && actionMenuItem === MENU_ITEMS.UNDO) historyPointer.current -= 1
            if (historyPointer.current < drawHistory.current.length - 1 && actionMenuItem === MENU_ITEMS.REDO) historyPointer.current += 1
            const imageData = drawHistory.current[historyPointer.current]
            context.putImageData(imageData, 0, 0)
        }

        dispatch(actionItemClick(null))
    }, [actionMenuItem])

    useEffect(() => {
        if (!canvasRef.current) return
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d')

        const changeConfig = (color, size) => {
            context.strokeStyle = color
            context.lineWidth = size
        }

        const handleChangeConfig = (config) => {
            console.log("config", config)
            changeConfig(config.color, config.size)
        }
        changeConfig(color, size)
        socket.on('changeConfig', handleChangeConfig)

        return () => {
            socket.off('changeConfig', handleChangeConfig)
        }
    }, [color, size])

    // useEffect(() => {
    //     if (!canvasRef.current) return;
    //     const canvas = canvasRef.current;
    //     const context = canvas.getContext('2d');

    //     console.log("Change ", color, " ", size);

    //     const changeConfig = (color, size) => {
    //         console.log("change config")
    //         context.strokeStyle = color
    //         context.lineWidth = size
    //     }

    //     const handleChangeConfig = (config) => {
    //         console.log("config", config)
    //         changeConfig(config.color, config.size)
    //     }

    //     changeConfig(color, size)
    //     socket.on('changeConfig', handleChangeConfig)

    //     return () => {
    //         socket.off('changeConfig', handleChangeConfig)
    //     }

    //     // const changeConfig = (color, size) => {
    //     //     context.strokeStyle = color;
    //     //     context.lineWidth = size;
    //     // }

    //     // const handleChangeConfig = (config) =>{
    //     //     console.log(config);
    //     //     changeConfig(config.color, config,size);
    //     // }

    //     // changeConfig(color, size);
    //     // // socket.on('changeConfig', () => changeConfig(config.color, config.size))
    //     // socket.on('changeConfig', handleChangeConfig)

    //     // return () => {
    //     //     socket.off('changeConfig', handleChangeConfig)
    //     // }

    // }, [color, size])

    useLayoutEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // when mounting
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const beginPath = (x, y) => {
            context.beginPath();
            context.moveTo(x, y);
        }

        const drawLine = (x, y) => {
            context.lineTo(x, y);
            context.stroke();
        }

        const handleMouseDown = (e) => {
            shouldDraw.current = true;
            beginPath(e.clientX, e.clientY);
            socket.emit('beginPath', { x: e.clientX, y: e.clientY })
        }

        const handleMouseUp = (e) => {
            shouldDraw.current = false;
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            drawHistory.current.push(imageData);
            historyPointer.current = drawHistory.current.length - 1;
        }

        const handleMouseMove = (e) => {
            if (!shouldDraw.current) return;
            drawLine(e.clientX, e.clientY);
            socket.emit('drawLine', { x: e.clientX, y: e.clientY })
        }

        const handleBeginPath = (path) => beginPath(path.x, path.y);
        const handleDrawLine = (path) => drawLine(path.x, path.y);

        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mousemove', handleMouseMove);

        socket.on('beginPath', handleBeginPath);
        socket.on('drawLine', handleDrawLine);

        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('mousemove', handleMouseMove);

            socket.off('beginPath', handleBeginPath);
            socket.off('drawLine', handleDrawLine);
        }
    }, [])

    return (
        <canvas ref={canvasRef}>

        </canvas>
    );
}

export default Board;